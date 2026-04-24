import { NextResponse } from 'next/server';
import { convertToPCM } from '@/lib/ffmpeg';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ detail: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to 16kHz Mono PCM Float32Array
    const pcmData = await convertToPCM(buffer);
    
    // We send it back as a regular array so it can be JSON stringified
    return NextResponse.json({ pcm: Array.from(pcmData) });
  } catch (err) {
    console.error("Parse Audio Error:", err);
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
