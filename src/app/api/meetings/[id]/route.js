import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const meetingId = parseInt(resolvedParams.id);

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!dbUser) return NextResponse.json({ detail: "Account not found" }, { status: 404 });

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId, userId: dbUser.id },
      include: {
        summary: true,
        actionItems: true,
        keyDecisions: true,
        strategicQuestions: true
      }
    });

    if (!meeting) {
      return NextResponse.json({ detail: 'Meeting not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: meeting.id,
      title: meeting.title,
      transcript: meeting.transcript,
      created_at: meeting.createdAt,
      summary: meeting.summary?.content || null,
      sentiment_label: meeting.summary?.sentimentLabel || null,
      sentiment_score: meeting.summary?.sentimentScore || null,
      action_items: meeting.actionItems.map(item => ({
        id: item.id,
        task: item.task,
        assignee: item.assignee,
        deadline: item.deadline
      })),
      key_decisions: meeting.keyDecisions.map(d => ({
        id: d.id,
        content: d.content
      })),
      strategic_questions: meeting.strategicQuestions.map(q => ({
        id: q.id,
        content: q.content
      }))
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const meetingId = parseInt(resolvedParams.id);

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!dbUser) return NextResponse.json({ detail: "Account not found" }, { status: 404 });

    await prisma.meeting.delete({
      where: { id: meetingId, userId: dbUser.id }
    });
    return NextResponse.json({ message: `Meeting ${meetingId} deleted successfully.` });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ detail: 'Delete failed' }, { status: 500 });
  }
}
