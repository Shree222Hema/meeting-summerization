import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';

/**
 * Converts audio buffer into a 16kHz Float32Array PCM required by Transformers.js Whisper.
 */
export async function convertToPCM(audioBuffer) {
  return new Promise((resolve, reject) => {
    const inputStream = new Readable();
    inputStream.push(audioBuffer);
    inputStream.push(null);

    const chunks = [];
    ffmpeg(inputStream)
      .audioFrequency(16000)
      .audioChannels(1)
      .format('s16le') // 16-bit PCM little endian
      .on('error', (err) => {
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .pipe()
      .on('data', (chunk) => {
        chunks.push(chunk);
      })
      .on('end', () => {
        const fullBuffer = Buffer.concat(chunks);
        const float32Array = new Float32Array(fullBuffer.length / 2);
        for (let i = 0; i < float32Array.length; i++) {
          const int16 = fullBuffer.readInt16LE(i * 2);
          float32Array[i] = int16 / 32768.0;
        }
        resolve(float32Array);
      });
  });
}
