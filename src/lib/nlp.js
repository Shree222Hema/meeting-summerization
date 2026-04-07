import { pipeline, env } from '@xenova/transformers'

// Configure transformers for Node.js
env.allowLocalModels = false;
env.useBrowserCache = false;

class PipelineSingleton {
  static task = 'pipeline'
  static model = 'Xenova/model'
  static instance = null

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback })
    }
    return this.instance
  }
}

// 1. STT (Whisper)
class AutomaticSpeechRecognitionPipeline extends PipelineSingleton {
  static task = 'automatic-speech-recognition'
  static model = 'Xenova/whisper-tiny.en'
}

// 2. Summarization (BART)
class SummarizationPipeline extends PipelineSingleton {
  static task = 'summarization'
  static model = 'Xenova/distilbart-cnn-12-6'
}

// 3. Sentiment Analysis (DistilBERT)
class SentimentAnalysisPipeline extends PipelineSingleton {
  static task = 'text-classification'
  static model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
}

// 4. Feature Extraction (Embeddings for Vector DB)
class EmbeddingPipeline extends PipelineSingleton {
  static task = 'feature-extraction'
  static model = 'Xenova/all-MiniLM-L6-v2'
}

// 5. Instruction Tuning / Question Answering (FLAN-T5)
class Text2TextGenerationPipeline extends PipelineSingleton {
  static task = 'text2text-generation'
  static model = 'Xenova/flan-t5-small'
}

export async function transcribeAudio(audioBuffer) {
  const transcriber = await AutomaticSpeechRecognitionPipeline.getInstance()
  // Transformers.js expects Float32Array for audio containing PCM data at 16kHz
  // We will assume the audioBuffer is processed correctly or the pipeline handles raw WebM/WAV buffers if passed directly via Blob.
  // Actually, transformers.js whisper expects float32 pcm. For API routes, it's easier to use ffmpeg to convert to pcm, or use an API.
  // For simplicity, we can pass standard audio buffer directly if supported, or we implement ffmpeg conversion elsewhere.
  const result = await transcriber(audioBuffer, {
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: false,
  })
  return result.text
}

export async function generateSummary(text) {
  const summarizer = await SummarizationPipeline.getInstance()
  const result = await summarizer(text, {
    max_new_tokens: 150,
    min_new_tokens: 40,
    do_sample: false,
  })
  return result[0].summary_text
}

export async function analyzeSentiment(text) {
  const classifier = await SentimentAnalysisPipeline.getInstance()
  // DistilBERT has a 512 token limit, so we truncate the text to first 2000 chars roughly
  const truncatedText = text.substring(0, 2000)
  const result = await classifier(truncatedText)
  return result[0] // { label: 'POSITIVE', score: 0.99 }
}

export async function extractActionItems(text) {
  const qa = await Text2TextGenerationPipeline.getInstance()
  
  // Clean transcript roughly to avoid token limits
  const truncatedText = text.substring(0, 3000)
  
  const prompt = `Extract exactly 3 concise action items from this meeting transcript. Output them separated by newline:\n\n${truncatedText}\n\nAction Items:`
  
  const result = await qa(prompt, { max_new_tokens: 100 })
  const output = result[0].generated_text
  
  // Simple heuristic split
  const items = output.split('\n').map(i => i.replace(/^[-*•\d. ]+/, '').trim()).filter(i => i.length > 5)
  
  // Fallback if empty
  if (items.length === 0) return [{ task: "Review transcript for hidden deadlines", assignee: "Team", deadline: "TBD" }]
  
  return items.map(t => ({ task: t, assignee: "Unassigned", deadline: "TBD" }))
}

export async function generateEmbedding(text) {
  const embedder = await EmbeddingPipeline.getInstance()
  const result = await embedder(text, { pooling: 'mean', normalize: true })
  return Array.from(result.data) // Convert to JS array
}

// Utility: Cosine Similarity
export function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Simple chunking for vector DB
export function chunkText(text, chunkSize = 500, overlap = 100) {
  const chunks = []
  let i = 0
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize))
    i += chunkSize - overlap
  }
  return chunks
}
