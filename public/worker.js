import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

console.log("[Worker] Static worker loaded from public folder.");

// Configure transformers for the browser environment
env.allowLocalModels = false;
env.useBrowserCache = true;

class PipelineSingleton {
  static task = null;
  static model = null;
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { 
        progress_callback,
      });
    }
    return this.instance;
  }
}

class AutomaticSpeechRecognitionPipeline extends PipelineSingleton {
  static task = 'automatic-speech-recognition';
  static model = 'Xenova/whisper-tiny';
}

class SentimentAnalysisPipeline extends PipelineSingleton {
  static task = 'text-classification';
  static model = 'Xenova/distilbert-base-multilingual-cased-sentiments-student';
}

class EmbeddingPipeline extends PipelineSingleton {
  static task = 'feature-extraction';
  static model = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
}

class Text2TextGenerationPipeline extends PipelineSingleton {
  static task = 'text2text-generation';
  static model = 'Xenova/flan-t5-small';
}

self.addEventListener('message', async (event) => {
  const { action, payload } = event.data;
  console.log(`[Worker] Received action: ${action}`);

  try {
    switch (action) {
      case 'ping':
        self.postMessage({ status: 'pong' });
        break;

      case 'synthesize':
        const { text, language, audioBuffer } = payload;
        let transcript = text;

        if (audioBuffer) {
          self.postMessage({ status: 'progress', step: 1, message: 'Transcribing audio...' });
          const transcriber = await AutomaticSpeechRecognitionPipeline.getInstance(x => {
             if (x.status === 'progress') self.postMessage({ status: 'download', data: x });
          });
          const result = await transcriber(audioBuffer, {
            chunk_length_s: 30,
            stride_length_s: 5,
            language: language.toLowerCase(),
            task: 'transcribe',
          });
          transcript = result.text;
        }

        const cleanedTranscript = transcript.replace(/\s+/g, ' ').trim();

        self.postMessage({ status: 'progress', step: 2, message: 'Generating summary...' });
        const summaryPipeline = await Text2TextGenerationPipeline.getInstance(x => {
           if (x.status === 'progress') self.postMessage({ status: 'download', data: x });
        });
        const truncatedSummary = cleanedTranscript.substring(0, 3000);
        let summary = "";
        
        if (truncatedSummary.length < 150) {
          // If the transcript is very short (like a YouTube Short), don't summarize it, just use it.
          summary = truncatedSummary;
        } else {
          const summaryPrompt = language.toLowerCase() === 'kannada' 
            ? `ಈ ಸಭೆಯ ಸಾರಾಂಶವನ್ನು ಕನ್ನಡದಲ್ಲಿ ಬರೆಯಿರಿ:\n\n${truncatedSummary}\n\nಸಾರಾಂಶ:`
            : `Summarize the following meeting transcript in English:\n\n${truncatedSummary}\n\nSummary:`;
          const summaryResult = await summaryPipeline(summaryPrompt, { max_new_tokens: 150 });
          summary = summaryResult[0].generated_text || truncatedSummary;
        }

        self.postMessage({ status: 'progress', step: 3, message: 'Analyzing sentiment...' });
        const sentimentPipeline = await SentimentAnalysisPipeline.getInstance(x => {
           if (x.status === 'progress') self.postMessage({ status: 'download', data: x });
        });
        const truncatedSentiment = cleanedTranscript.substring(0, 2000);
        const sentimentResult = await sentimentPipeline(truncatedSentiment);
        const sentiment = {
          label: sentimentResult[0].label.toUpperCase(),
          score: Math.round(sentimentResult[0].score * 100)
        };

        self.postMessage({ status: 'progress', step: 4, message: 'Extracting action items...' });
        const actionItemsPrompt = language.toLowerCase() === 'kannada'
          ? `ಈ ಸಭೆಯ ಪ್ರಮುಖ 3 ಕಾರ್ಯಗಳನ್ನು (action items) ಕನ್ನಡದಲ್ಲಿ ಪಟ್ಟಿ ಮಾಡಿ:\n\n${truncatedSummary}\n\nಕಾರ್ಯಗಳು:`
          : `Extract exactly 3 concise action items from this meeting transcript in English. Output them separated by newline:\n\n${truncatedSummary}\n\nAction Items:`;
        const actionItemsResult = await summaryPipeline(actionItemsPrompt, { max_new_tokens: 100 });
        const actionItemsOutput = actionItemsResult[0].generated_text;
        let actionItems = actionItemsOutput.split('\n')
          .map(i => i.replace(/^[-*•\d. ]+/, '').trim())
          .filter(i => i.length > 5)
          .map(t => ({ task: t, assignee: "Unassigned", deadline: "TBD" }));

        // Fallback for very short content or empty results
        if (actionItems.length === 0 && truncatedSummary.length > 0) {
          actionItems = [{ task: "Review transcript details", assignee: "Admin", deadline: "ASAP" }];
        }

        self.postMessage({ status: 'progress', step: 5, message: 'Building knowledge base...' });
        const embedder = await EmbeddingPipeline.getInstance(x => {
           if (x.status === 'progress') self.postMessage({ status: 'download', data: x });
        });
        const chunks = chunkText(cleanedTranscript);
        const chunkData = [];
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          self.postMessage({ 
            status: 'progress', 
            step: 5, 
            message: `Building knowledge base: ${i + 1} / ${chunks.length} units...` 
          });
          const emb = await embedder(chunk, { pooling: 'mean', normalize: true });
          chunkData.push({ content: chunk, embedding: JSON.stringify(Array.from(emb.data)) });
        }

        self.postMessage({ 
          status: 'complete', 
          data: {
            transcript: cleanedTranscript,
            summary,
            sentiment,
            actionItems,
            chunks: chunkData
          } 
        });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("[Worker] Critical Error:", error);
    self.postMessage({ status: 'error', error: error.message });
  }
});

function chunkText(text, chunkSize = 500, overlap = 100) {
  const chunks = []
  let i = 0
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize))
    i += chunkSize - overlap
  }
  return chunks
}
