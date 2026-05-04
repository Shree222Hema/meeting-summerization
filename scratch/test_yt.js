const { YoutubeTranscript } = require('youtube-transcript');

async function test() {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript('fXv3fL7t8X8');
    console.log("Success!");
    console.log(transcript.slice(0, 3).map(t => t.text).join(' '));
  } catch (e) {
    console.error("Failed:", e.message);
  }
}

test();
