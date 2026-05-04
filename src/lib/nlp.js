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

// 1. STT (Whisper Multilingual)
class AutomaticSpeechRecognitionPipeline extends PipelineSingleton {
  static task = 'automatic-speech-recognition'
  static model = 'Xenova/whisper-tiny'
}

// 2. Multilingual Sentiment Analysis
class SentimentAnalysisPipeline extends PipelineSingleton {
  static task = 'text-classification'
  static model = 'Xenova/distilbert-base-multilingual-cased-sentiments-student'
}

// 3. Feature Extraction (Embeddings for Vector DB - Multilingual)
class EmbeddingPipeline extends PipelineSingleton {
  static task = 'feature-extraction'
  static model = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
}

// 4. Instruction Tuning / Question Answering / Summarization (FLAN-T5 Multilingual)
class Text2TextGenerationPipeline extends PipelineSingleton {
  static task = 'text2text-generation'
  static model = 'Xenova/flan-t5-small'
}

export async function transcribeAudio(audioBuffer, language = 'english') {
  const transcriber = await AutomaticSpeechRecognitionPipeline.getInstance()
  const result = await transcriber(audioBuffer, {
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: false,
    language: language.toLowerCase(), // Whisper supports 'kannada', 'english', etc.
    task: 'transcribe',
  })
  return result.text
}

export async function generateSummary(text, language = 'english') {
  const qa = await Text2TextGenerationPipeline.getInstance()
  
  // Clean transcript roughly to avoid token limits
  const truncatedText = text.substring(0, 3000)
  
  const prompt = language.toLowerCase() === 'kannada' 
    ? `ಈ ಸಭೆಯ ಸಾರಾಂಶವನ್ನು ಕನ್ನಡದಲ್ಲಿ ಬರೆಯಿರಿ:\n\n${truncatedText}\n\nಸಾರಾಂಶ:`
    : language.toLowerCase() === 'hindi'
    ? `इस बैठक का सारांश हिंदी में लिखें:\n\n${truncatedText}\n\nसारांश:`
    : `Summarize the following meeting transcript in English:\n\n${truncatedText}\n\nSummary:`
  
  const result = await qa(prompt, { max_new_tokens: 150 })
  return result[0].generated_text
}

export async function analyzeSentiment(text) {
  const classifier = await SentimentAnalysisPipeline.getInstance()
  const truncatedText = text.substring(0, 2000)
  const result = await classifier(truncatedText)
  
  // Map multilingual sentiment labels (usually 1-5 stars or positive/negative)
  // distilbert-base-multilingual-cased-sentiments-student usually returns 'positive', 'neutral', 'negative'
  const label = result[0].label.toUpperCase()
  return { label, score: result[0].score }
}

export async function extractActionItems(text, language = 'english') {
  const qa = await Text2TextGenerationPipeline.getInstance()
  
  const truncatedText = text.substring(0, 3000)
  
  const prompt = language.toLowerCase() === 'kannada'
    ? `ಈ ಸಭೆಯ ಪ್ರಮುಖ 3 ಕಾರ್ಯಗಳನ್ನು (action items) ಕನ್ನಡದಲ್ಲಿ ಪಟ್ಟಿ ಮಾಡಿ:\n\n${truncatedText}\n\nಕಾರ್ಯಗಳು:`
    : language.toLowerCase() === 'hindi'
    ? `इस बैठक के मुख्य 3 कार्य बिंदुओं (action items) को हिंदी में सूचीबद्ध करें:\n\n${truncatedText}\n\nकार्य बिंदु:`
    : `Extract exactly 3 concise action items from this meeting transcript in English. Output them separated by newline:\n\n${truncatedText}\n\nAction Items:`
  
  const result = await qa(prompt, { max_new_tokens: 100 })
  const output = result[0].generated_text
  
  // Simple heuristic split
  const items = output.split('\n').map(i => i.replace(/^[-*•\d. ]+/, '').trim()).filter(i => i.length > 5)
  
  // Fallback if empty
  if (items.length === 0) {
    return language.toLowerCase() === 'kannada'
      ? [{ task: "ಸಭೆಯ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ", assignee: "ತಂಡ", deadline: "ನಿರ್ಧರಿಸಲಾಗಿಲ್ಲ" }]
      : language.toLowerCase() === 'hindi'
      ? [{ task: "बैठक के विवरण की समीक्षा करें", assignee: "टीम", deadline: "टीबीडी" }]
      : [{ task: "Review transcript for hidden deadlines", assignee: "Team", deadline: "TBD" }]
  }
  
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
