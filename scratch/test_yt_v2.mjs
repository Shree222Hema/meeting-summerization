import { YoutubeTranscript } from 'youtube-transcript';

YoutubeTranscript.fetchTranscript('fXv3fL7t8X8')
  .then(transcript => {
    console.log("Success!");
    console.log(transcript.slice(0, 3).map(t => t.text).join(' '));
  })
  .catch(e => {
    console.error("Failed:", e.message);
  });
