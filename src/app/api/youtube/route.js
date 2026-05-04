import { NextResponse } from 'next/server';
import https from 'https';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const lang = searchParams.get('lang') || 'en';

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
    const transcript = await fetchTranscriptNative(videoId, lang);
    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("❌ YouTube API Error:", err);
    return NextResponse.json({ 
      detail: `YouTube transcript fetch failed: ${err.message}.` 
    }, { status: 500 });
  }
}

async function fetchTranscriptNative(videoId, targetLang = 'en') {
  return new Promise((resolve, reject) => {
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
          // 1. Extract the captions metadata
          const regex = /"captionTracks":\[(.*?)\]/;
          const match = data.match(regex);
          if (!match) return reject(new Error("No captions found on this video."));
          
          const captionTracks = JSON.parse(`[${match[1]}]`);
          
          // 2. Determine target language code
          const langMap = { 'english': 'en', 'hindi': 'hi', 'kannada': 'kn' };
          const targetCode = langMap[targetLang.toLowerCase()] || targetLang;

          // 3. Find the best track
          const targetTrack = captionTracks.find(t => t.languageCode === targetCode || t.languageCode.startsWith(targetCode + '-')) 
                             || captionTracks.find(t => t.languageCode === 'en' || t.languageCode === 'en-US') 
                             || captionTracks[0];
          
          if (!targetTrack) return reject(new Error(`No suitable captions available.`));

          // 4. Fetch the XML transcript
          https.get(targetTrack.baseUrl, (tRes) => {
            let tData = '';
            tRes.on('data', (tChunk) => { tData += tChunk; });
            tRes.on('end', () => {
              // 5. Clean XML to plain text
              const text = tData
                .replace(/<text[^>]*>/g, '')
                .replace(/<\/text>/g, ' ')
                .replace(/<[^>]*>/g, '') // Remove remaining tags
                .replace(/&amp;#39;/g, "'")
                .replace(/&amp;/g, "&")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\s+/g, ' ')
                .trim();
              
              if (text.length < 5) return reject(new Error("Transcript extracted but was empty."));
              resolve(text);
            });
          }).on('error', (e) => reject(new Error(`Failed to fetch XML: ${e.message}`)));
        } catch (e) {
          reject(new Error(`Parsing failed: ${e.message}`));
        }
      });
    }).on('error', (e) => reject(new Error(`Connection failed: ${e.message}`)));
  });
}
