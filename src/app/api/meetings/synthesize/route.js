import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Next.js config to allow longer execution for large models
export const maxDuration = 300;

export async function GET() {
  return NextResponse.json({ message: "Synthesize endpoint is reachable" });
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { 
      title, 
      transcript, 
      summary, 
      sentiment, 
      actionItems, 
      chunks 
    } = body;

    if (!transcript || !summary) {
      return NextResponse.json({ detail: "Incomplete synthesis data provided." }, { status: 400 });
    }

    // DB Save
    const meeting = await prisma.meeting.create({
      data: {
        title: title || 'Strategic Synthesis',
        transcript: transcript,
        userId: parseInt(session.user.id),
        summary: {
          create: {
            content: summary,
            sentimentLabel: sentiment?.label || 'NEUTRAL',
            sentimentScore: sentiment?.score || 50
          }
        },
        actionItems: {
          create: (actionItems || []).map(i => ({
            task: i.task,
            assignee: i.assignee || 'Unassigned',
            deadline: i.deadline || 'TBD'
          }))
        },
        chunks: {
          create: (chunks || []).map(c => ({
            content: c.content,
            embedding: c.embedding
          }))
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
      message: "Intelligence successfully persisted."
    });

  } catch (err) {
    console.error("Database Persistence Error:", err);
    return NextResponse.json({ detail: "Failed to save synthesis results: " + err.message }, { status: 500 });
  }
}
