import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ detail: "URL is required" }, { status: 400 });
  }

  try {
    const transcriptArr = await YoutubeTranscript.fetchTranscript(url);
    const transcript = transcriptArr.map(t => t.text).join(' ');
    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("YouTube Error:", err);
    return NextResponse.json({ detail: "Failed to fetch YouTube transcript. Make sure the video has captions enabled." }, { status: 500 });
  }
}
