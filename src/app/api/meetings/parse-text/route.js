import { NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ detail: "No file provided" }, { status: 400 });
    }

    const type = file.name.split('.').pop().toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = "";
    if (type === 'txt') {
      text = buffer.toString('utf-8');
    } else if (type === 'pdf') {
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else if (type === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json({ detail: "Unsupported file format" }, { status: 400 });
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Parse Text Error:", err);
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
