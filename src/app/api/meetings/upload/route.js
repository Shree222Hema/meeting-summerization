import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { convertToPCM } from '@/lib/ffmpeg';

// Next.js config to allow longer execution for large models
export const maxDuration = 300; // Increased for Vercel Hobby tier AI processing

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const title = formData.get('title');
    const file = formData.get('file');
    const text = formData.get('text');
    const url = formData.get('url');

    if (!file && !text && !url) {
      return NextResponse.json({ detail: "Either file, text, or url must be provided." }, { status: 400 });
    }

    let transcript = "";

    console.log("Ingesting Data...");

    // 1. Process URL (YouTube)
    if (url) {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        try {
          const { YoutubeTranscript } = await import('youtube-transcript/dist/youtube-transcript.esm.js');
          const transcriptArr = await YoutubeTranscript.fetchTranscript(url);
          transcript = transcriptArr.map(t => t.text).join(' ');
          console.log("YouTube Transcription successful.");
        } catch (e) {
          console.error("Youtube Transcript Error", e);
          return NextResponse.json({ detail: "Failed to extract intelligence from YouTube URL." }, { status: 400 });
        }
      } else {
        return NextResponse.json({ detail: "Only YouTube URLs are supported for virtual feeds currently." }, { status: 400 });
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
        const _pdfParse = await import('pdf-parse');
        const pdfParse = _pdfParse.default || _pdfParse;
        const parsed = await pdfParse(buffer);
        transcript = parsed.text;
      } else if (type === 'docx') {
        const mammothModule = await import('mammoth');
        const mammoth = mammothModule.default || mammothModule;
        const result = await mammoth.extractRawText({ buffer });
        transcript = result.value;
      } else if (['mp3', 'wav', 'm4a', 'mp4', 'webm', 'mov'].includes(type)) {
        console.log("Extracting audio features via FFmpeg...");
        const pcmData = await convertToPCM(buffer);
        console.log("Transcribing using Whisper local engine...");
        const { transcribeAudio } = await import('@/lib/nlp');
        transcript = await transcribeAudio(pcmData);
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

    console.log("Synthesizing Context...");
    
    // 4. Run NLP Pipelines
    const {
      generateSummary,
      analyzeSentiment,
      extractActionItems,
      generateEmbedding,
      chunkText
    } = await import('@/lib/nlp');
    
    const [summaryText, sentimentOutput, actionItemsText] = await Promise.all([
      generateSummary(cleanedTranscript),
      analyzeSentiment(cleanedTranscript),
      extractActionItems(cleanedTranscript)
    ]);

    // 5. Run Embedding Generation for RAG
    const chunks = chunkText(cleanedTranscript);
    const chunkPromises = chunks.map(async (c) => {
      const emb = await generateEmbedding(c);
      return { content: c, embedding: JSON.stringify(emb) };
    });
    const chunkData = await Promise.all(chunkPromises);

    console.log("Persisting Relational Storage...");

    // 6. DB Save via Prisma Transaction
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

    console.log("Pipeline Finished Successfully!");

    return NextResponse.json({
      id: meeting.id,
      title: meeting.title,
      transcript: meeting.transcript,
      created_at: meeting.createdAt,
      summary: meeting.summary.content,
      sentiment_label: meeting.summary.sentimentLabel,
      sentiment_score: meeting.summary.sentimentScore,
      action_items: meeting.actionItems.map(item => ({
        id: item.id,
        task: item.task,
        assignee: item.assignee,
        deadline: item.deadline
      })),
      message: "Strategic synthesis complete."
    });

  } catch (err) {
    console.error("Upload API Error:", err);
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
