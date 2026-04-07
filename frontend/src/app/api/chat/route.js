import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const maxDuration = 300; // Increased for AI processing

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const { query } = await request.json();
    if (!query) return NextResponse.json({ detail: 'Query cannot be empty.' }, { status: 400 });
    
    // 1. Generate query embedding
    const { generateEmbedding, cosineSimilarity } = await import('@/lib/nlp');
    const queryVector = await generateEmbedding(query);
    
    // 2. Compute similarity across ALL chunks
    const chunks = await prisma.meetingChunk.findMany({
      where: {
        meeting: {
          userId: parseInt(session.user.id)
        }
      },
      select: {
        id: true,
        content: true,
        embedding: true,
        meetingId: true
      }
    });
    
    let scoredChunks = chunks.map(chunk => {
      const vecB = JSON.parse(chunk.embedding);
      const score = cosineSimilarity(queryVector, vecB);
      return { ...chunk, score };
    });
    
    // 3. Retrieve Top 3 most relevant chunks
    scoredChunks.sort((a, b) => b.score - a.score);
    const topChunks = scoredChunks.slice(0, 3).filter(c => c.score > 0.3); // Threshold
    
    if (topChunks.length === 0) {
      return NextResponse.json({ 
        answer: "I don't have enough information in any past meetings to answer this.", 
        sources: [] 
      });
    }
    
    // 4. Construct Context for LLM
    const context = topChunks.map(c => `--- Excerpt from Meeting ${c.meetingId} ---\n${c.content}`).join('\n\n');
    
    const prompt = `You are a helpful Meeting Intelligence AI. Answer the user's question based ONLY on the following excerpts from past meetings.\n\nExcerpts:\n${context}\n\nQuestion:\n${query}`;
    
    // 5. Run LLM Inference
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false;
    env.useBrowserCache = false;
    
    const qaPipeline = await pipeline('text2text-generation', 'Xenova/flan-t5-small');
    const result = await qaPipeline(prompt, { max_length: 150, do_sample: false });
    
    const answer = result[0].generated_text;
    const sources = [...new Set(topChunks.map(c => c.meetingId))];
    
    return NextResponse.json({ answer, sources });
    
  } catch (error) {
    console.error('Chat Error:', error);
    return NextResponse.json({ answer: 'Error generating answer from context.', sources: [] }, { status: 500 });
  }
}
