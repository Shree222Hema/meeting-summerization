# Meeting Intelligence AI

An advanced, end-to-end AI project capable of automatically analyzing meeting transcripts, audio files, video files, YouTube links, and live microphone recordings to generate concise summaries, extract actionable items, and provide semantic RAG queries over past meetings using local LLMs.

### Features
* **Multi-Modal Uploads:** Upload TXT, PDF, DOCX, MP3, WAV, M4A, MP4, WEBM, and MOV files.
* **YouTube Ingestion:** Paste a YouTube URL to automatically extract intelligence from the video feed.
* **Live Transcription:** Record audio directly from your browser.
* **Local STT & NLP:** Uses `Transformers.js` (Whisper, BART, DistilBERT, FLAN-T5) to process everything in your backend environment.
* **Sentiment Analysis:** Analyzes the overarching emotional tone of every meeting.
* **RAG Chat Engine:** Automatically slices transcripts into embeddings for semantic search over past meetings.
* **Premium Dashboard:** A responsive Next.js frontend with rich glassmorphism UI elements.

## Setup Instructions

### Prerequisites
* **Node.js (v18+)**
* **FFmpeg** installed globally on your machine (Required for audio processing).

### Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file (see `.env.example`) and add your database URL and NextAuth secret.

3. **Initialize Database**:
   ```bash
   npx prisma generate
   # For local testing with sqlite:
   npx prisma db push
   ```

4. **Run the Application**:
   ```bash
   npm run dev
   ```

Navigate to `http://localhost:3000` to access the Dashboard.

## Vercel Deployment

This project is optimized for Vercel:
- **Root Directory**: The repository is now flattened, so Vercel will detect it automatically.
- **Environment Variables**: Add your `DATABASE_URL` (Postgres) and `NEXTAUTH_SECRET` in the Vercel Dashboard.
- **Timeout Configuration**: API routes are configured with `maxDuration: 300` to handle AI processing times.
