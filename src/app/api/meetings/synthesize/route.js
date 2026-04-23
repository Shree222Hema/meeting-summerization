import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { convertToPCM } from '@/lib/ffmpeg';
import { 
  transcribeAudio, 
  generateSummary, 
  analyzeSentiment, 
  extractActionItems, 
  generateEmbedding, 
  chunkText 
} from '@/lib/nlp';

// Next.js config to allow longer execution for large models
export const maxDuration = 300;

export async function GET() {
  return NextResponse.json({ message: "Synthesize endpoint is reachable" });
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const title = formData.get('title');
    const file = formData.get('file');
    const text = formData.get('text');
    const url = formData.get('url');
    const language = formData.get('language') || 'english';

    if (!file && !text && !url) {
      return NextResponse.json({ detail: "Either file, text, or url must be provided." }, { status: 400 });
    }

    let transcript = "";

    // 1. Process URL (YouTube)
    if (url) {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        try {
          const { YoutubeTranscript } = await import('youtube-transcript');
          const transcriptArr = await YoutubeTranscript.fetchTranscript(url);
          transcript = transcriptArr.map(t => t.text).join(' ');
        } catch (e) {
          console.error("Youtube Transcript Error", e);
          return NextResponse.json({ detail: "Failed to extract intelligence from YouTube URL." }, { status: 400 });
        }
      } else {
        return NextResponse.json({ detail: "Only YouTube URLs are supported currently." }, { status: 400 });
      }
    } 
    // 2. Process File
    else if (file) {
      const type = file.name.split('.').pop().toLowerCase();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (type === 'txt') {
        transcript = buffer.toString('utf-8');
      } else if (type === 'pdf') {
        const pdfParse = (await import('pdf-parse')).default;
        const parsed = await pdfParse(buffer);
        transcript = parsed.text;
      } else if (type === 'docx') {
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.extractRawText({ buffer });
        transcript = result.value;
      } else if (['mp3', 'wav', 'm4a', 'mp4', 'webm', 'mov'].includes(type)) {
        const pcmData = await convertToPCM(buffer);
        transcript = await transcribeAudio(pcmData, language);
      } else {
        return NextResponse.json({ detail: "Unsupported file format." }, { status: 400 });
      }
    } 
    // 3. Process Text
    else {
      transcript = text;
    }

    const cleanedTranscript = transcript.replace(/\s+/g, ' ').trim();
    if (!cleanedTranscript) {
      return NextResponse.json({ detail: "Resulting transcript is empty." }, { status: 400 });
    }

    // 4. Run NLP Pipelines
    const [summaryText, sentimentOutput, actionItemsText] = await Promise.all([
      generateSummary(cleanedTranscript, language),
      analyzeSentiment(cleanedTranscript),
      extractActionItems(cleanedTranscript, language)
    ]);

    // 5. Run Embedding Generation for RAG
    const chunks = chunkText(cleanedTranscript);
    const chunkPromises = chunks.map(async (c) => {
      const emb = await generateEmbedding(c);
      return { content: c, embedding: JSON.stringify(emb) };
    });
    const chunkData = await Promise.all(chunkPromises);

    // 6. DB Save
    const meeting = await prisma.meeting.create({
      data: {
        title: title || 'Strategic Synthesis',
        transcript: cleanedTranscript,
        userId: parseInt(session.user.id),
        summary: {
          create: {
            content: summaryText,
            sentimentLabel: sentimentOutput.label,
            sentimentScore: Math.round(sentimentOutput.score * 100)
          }
        },
        actionItems: {
          create: actionItemsText.map(i => ({
            task: i.task,
            assignee: i.assignee || 'Unassigned',
            deadline: i.deadline || 'TBD'
          }))
        },
        chunks: {
          create: chunkData
        }
      },
      include: {
        summary: true,
        actionItems: true
      }
    });

    return NextResponse.json({
      id: meeting.id,
      title: meeting.title,
      transcript: meeting.transcript,
      summary: meeting.summary.content,
      sentiment_label: meeting.summary.sentimentLabel,
      sentiment_score: meeting.summary.sentimentScore,
      action_items: meeting.actionItems,
      message: "Synthesis complete."
    });

  } catch (err) {
    console.error("Pipeline Error:", err);
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
