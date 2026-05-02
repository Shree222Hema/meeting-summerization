import { NextResponse } from 'next/server';
import https from 'https';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ detail: "URL is required" }, { status: 400 });
  }

  // Extract Video ID
  let videoId = "";
  try {
    if (url.includes('/shorts/')) {
      videoId = url.split('/shorts/')[1].split('?')[0];
    } else if (url.includes('v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else {
      videoId = url;
    }
  } catch (e) {
    return NextResponse.json({ detail: "Invalid YouTube URL" }, { status: 400 });
  }

  try {
    const transcript = await fetchTranscriptNative(videoId);
    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("❌ YouTube Native Error:", err);
    return NextResponse.json({ 
      detail: `YouTube blocked the automated link fetch. This is common on local networks. For now, please use 'Manual Text Entry' while I work on a more permanent server-side proxy.` 
    }, { status: 500 });
  }
}

async function fetchTranscriptNative(videoId) {
  return new Promise((resolve, reject) => {
    // We try to fetch the video page to find the transcript metadata
    const options = {
      hostname: 'www.youtube.com',
      path: `/watch?v=${videoId}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', async () => {
        try {
          // Look for captions JSON in the page source
          const regex = /"captionTracks":\[(.*?)\]/;
          const match = data.match(regex);
          if (!match) return reject(new Error("No captions found on this video."));
          
          const captionTracks = JSON.parse(`[${match[1]}]`);
          const englishTrack = captionTracks.find(t => t.languageCode === 'en' || t.languageCode === 'en-US') || captionTracks[0];
          
          if (!englishTrack) return reject(new Error("No English captions available."));

          // Fetch the actual XML transcript
          https.get(englishTrack.baseUrl, (tRes) => {
            let tData = '';
            tRes.on('data', (tChunk) => { tData += tChunk; });
            tRes.on('end', () => {
              // Simple XML to Text conversion
              const text = tData.replace(/<[^>]*>/g, ' ').replace(/&amp;#39;/g, "'").replace(/&quot;/g, '"');
              resolve(text.trim());
            });
          }).on('error', reject);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}
