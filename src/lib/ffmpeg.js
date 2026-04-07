import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';

/**
 * Converts audio buffer into a 16kHz Float32Array PCM required by Transformers.js Whisper.
 */
export async function convertToPCM(audioBuffer) {
  return new Promise((resolve, reject) => {
    const pcmData = [];
    const inputStream = new Readable();
    inputStream.push(audioBuffer);
    inputStream.push(null);

    ffmpeg(inputStream)
      .inputFormat('any')
      .audioFrequency(16000)
      .audioChannels(1)
      .format('s16le') // 16-bit PCM little endian
      .on('error', (err) => {
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .on('data', (chunk) => {
        // Collect chunks
      })
      .pipe()
      .on('data', (chunk) => {
        // Convert Int16 to Float32
        for (let i = 0; i < chunk.length; i += 2) {
          const int16 = chunk.readInt16LE(i);
          pcmData.push(int16 / 32768.0); // Normalize to [-1.0, 1.0]
        }
      })
      .on('end', () => {
        resolve(new Float32Array(pcmData));
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}
