# Meeting Intelligence AI

An advanced, end-to-end AI project capable of automatically analyzing meeting transcripts, audio files, video files, YouTube links, and live microphone recordings to generate concise summaries, extract actionable items, and provide semantic RAG queries over past meetings using local LLMs.

### Features
* **Multi-Modal Uploads:** Upload TXT, PDF, DOCX, MP3, WAV, M4A, MP4, WEBM, and MOV files.
* **YouTube Ingestion:** Paste a YouTube URL to automatically download and process the audio stream via `yt-dlp`.
* **Live Transcription:** Record audio directly from your browser.
* **OpenAI Whisper STT:** Transcribes speech to text entirely locally using `whisper-tiny`.
* **Summary & Action Items:** Summarizes the meeting using `facebook/bart-large-cnn` and extracts deadlines and assignees via `NLTK`.
* **Sentiment Analysis:** Analyzes the overarching emotional tone of every meeting (Positive/Negative) using `distilbert-base-uncased-finetuned-sst-2-english`.
* **RAG Chat Engine:** Automatically slices transcripts into embeddings stored in a local `ChromaDB` vector database, queryable using `google/flan-t5-small` to answer explicit questions about past meetings.
* **Premium Dashboard:** A responsive Next.js frontend featuring rich glassmorphism UI elements and animations.

## Setup Instructions

### Prerequisites
* **Python 3.9+**
* **Node.js (v18+)**
* **FFmpeg** installed globally on your machine (Required for Whisper and yt-dlp to process audio data).

---

### Step 1: Start the Backend (FastAPI)

**For Windows Users:**
```powershell
# Open a command prompt or PowerShell and navigate to the backend folder
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
pip install yt-dlp chromadb sentence-transformers langchain-huggingface google-genai

# Start the Fast API Server
uvicorn main:app --port 8000 --reload
```

**For Linux/Mac Users:**
```bash
# Navigate to the backend folder
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
pip install yt-dlp chromadb sentence-transformers langchain-huggingface google-genai

# Start the Fast API Server
uvicorn main:app --port 8000 --reload
```

*(Note: The first time you upload a file, the Python script will automatically download the HuggingFace models (BART, DistilBERT, Whisper, Minilm, and FLAN-T5). This may take several minutes depending on your internet connection).*

---

### Step 2: Start the Frontend (Next.js)

**For both Windows and Linux:**
```bash
# Open a NEW terminal side-by-side with your backend terminal
# Navigate to the frontend folder
cd frontend

# Install Node dependencies
npm install

# Start the Next.js development server
npm run dev
```

Navigate to `http://localhost:3000` (or whichever port Next.js assigns you in the console output) to access the Dashboard.
