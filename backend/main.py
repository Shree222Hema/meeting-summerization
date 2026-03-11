from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, Body, BackgroundTasks
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import logging
import PyPDF2
import docx
import io
import concurrent.futures

import os
import shutil
import subprocess
import models
from database import engine, get_db
from nlp import preprocessing, summarizer, extractor, transcriber, sentiment, rag_engine
from youtube_transcript_api import YouTubeTranscriptApi


# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables and DB
models.Base.metadata.create_all(bind=engine)

# Load AI Pipelines Lazily
_qa_pipeline = None

def get_qa_pipeline():
    global _qa_pipeline
    if _qa_pipeline is None:
        try:
            from transformers import pipeline
            logger.info("Initializing Global QA Brain (Lazy)...")
            _qa_pipeline = pipeline("text2text-generation", model="google/flan-t5-small", device=-1)
            logger.info("QA Pipeline online.")
        except Exception as e:
            logger.error(f"Failed to initialize QA Pipeline: {e}")
    return _qa_pipeline

app = FastAPI(title="Meeting Summarization API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Meeting Summarization API is running"}

class ChatRequest(BaseModel):
    query: str

@app.post("/api/chat")
def chat_with_meetings(request: ChatRequest):
    """
    RAG Endpoint: Queries the ChromaDB vector database with the user's question,
    retrieves the top 3 most relevant meeting chunks, and uses a local LLM to answer.
    """
    user_query = request.query
    if not user_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    logger.info(f"Received Chat Query: {user_query}")
    
    # 1. Retrieve relevant chunks from Vector DB
    relevant_chunks = rag_engine.query_meetings(user_query, top_k=3)
    
    if not relevant_chunks:
        return {"answer": "I don't have enough information in any past meetings to answer this.", "sources": []}
        
    # 2. Construct context for LLM
    context = "\n\n".join([f"--- Excerpt from Meeting {c['meeting_id']} ---\n{c['content']}" for c in relevant_chunks])
    
    prompt = f"""
You are a helpful Meeting Intelligence AI. Answer the user's question based ONLY on the following excerpts from past meetings. 
If the answer is not contained within the excerpts, reply "I cannot find the answer in the provided meeting transcripts."

Excerpts:
{context}

Question:
{user_query}
"""
    
    # 3. Generate Answer (using organized global pipeline)
    qa_model = get_qa_pipeline()
    if not qa_model:
        return {"answer": "Chat Engine Offline. Please check server logs.", "sources": []}
        
    try:
        answer = qa_model(prompt, max_length=150, do_sample=False)[0]['generated_text']
        
        # Format sources to return to UI
        sources = list(set([c['meeting_id'] for c in relevant_chunks]))
        
        return {
            "answer": answer,
            "sources": sources
        }
    except Exception as e:
        logger.error(f"Chat LLM Error: {e}")
        return {"answer": "Error generating answer from context.", "sources": []}

@app.delete("/api/meetings/{meeting_id}")
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # 1. Delete from Vector DB
    try:
        rag_engine.delete_transcript_from_vector_db(meeting_id)
    except Exception as e:
        logger.error(f"Failed to delete from Vector DB: {e}")
        # We continue even if vector deletion fails, to keep DB in sync
    
    # 2. Delete from SQL DB (Cascades to Summary and ActionItems)
    db.delete(meeting)
    db.commit()
    
    return {"message": f"Meeting {meeting_id} deleted successfully."}

@app.post("/api/meetings/upload")
async def upload_meeting(
    background_tasks: BackgroundTasks,
    title: str = Form(...), 
    file: UploadFile = File(None), 
    text: str = Form(None), 
    url: str = Form(None),
    db: Session = Depends(get_db)
):
    if not file and not text and not url:
        raise HTTPException(status_code=400, detail="Either file, text, or url must be provided.")
        
    transcript = ""
    
    # If it's a URL (like YouTube)
    if url:
        logger.info(f"Processing External Feed: {url}")
        try:
            # YouTube Fast-Track: Try fetching transcript directly
            video_id = None
            if "youtube.com" in url or "youtu.be" in url:
                import re
                patterns = [r"v=([a-zA-Z0-9_-]+)", r"be/([a-zA-Z0-9_-]+)"]
                for p in patterns:
                    match = re.search(p, url)
                    if match:
                        video_id = match.group(1)
                        break
            
            if video_id:
                logger.info(f"Detected YouTube ID: {video_id}. Attempting Fast-Track Extraction...")
                try:
                    # Robust YouTube Transcript Fetching
                    try:
                        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
                        transcript = " ".join([t['text'] for t in transcript_list])
                    except (AttributeError, Exception) as e:
                        # Fallback for different API versions or missing method
                        logger.info(f"get_transcript failed or missing ({e}), trying list_transcripts...")
                        t_list = YouTubeTranscriptApi.list_transcripts(video_id)
                        transcript = " ".join([t['text'] for t in t_list.find_transcript(['en']).fetch()])

                    
                    logger.info("YouTube Fast-Track Successful.")
                except Exception as api_err:
                    logger.warning(f"Fast-Track unavailable ({api_err}). Falling back to heavy processing...")
                    video_id = None # Trigger fallback

            if not video_id:
                # Heavy Fallback (Download + Whisper)
                temp_audio = "temp_download.wav"
                # Use robust path for yt-dlp
                yt_dlp_cmd = shutil.which("yt-dlp") or os.path.join(os.getcwd(), "venv/bin/yt-dlp")
                
                subprocess.run([
                    yt_dlp_cmd,
                    "-f", "bestaudio/best",
                    "-x", "--audio-format", "wav",
                    "-o", "temp_download.%(ext)s",
                    url
                ], check=True)
                
                logger.info("Transcribing downloaded audio...")
                transcript = transcriber.transcribe_audio(temp_audio)
                if os.path.exists(temp_audio):
                    os.remove(temp_audio)
        except Exception as e:
            logger.error(f"Failed to process URL: {e}")
            raise HTTPException(status_code=400, detail="Failed to extract intelligence from URL.")
                
    elif file:
        filename = file.filename.lower()
        if filename.endswith(".txt"):
            content = await file.read()
            transcript = content.decode("utf-8")
        elif filename.endswith(".pdf"):
            content = await file.read()
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages:
                transcript += (page.extract_text() or "") + "\n"
        elif filename.endswith(".docx"):
            content = await file.read()
            doc = docx.Document(io.BytesIO(content))
            for paragraph in doc.paragraphs:
                transcript += paragraph.text + "\n"
        elif filename.endswith((".mp3", ".wav", ".m4a", ".mp4", ".webm", ".mov")):
            # Save audio/video to temp file to be processed by Whisper
            temp_path = f"temp_{filename}"
            try:
                with open(temp_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                
                logger.info("Transcribing media file...")
                transcript = transcriber.transcribe_audio(temp_path)
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format.")
    else:
        transcript = text
        
    # Process transcript
    logger.info("Cleaning transcript...")
    cleaned_transcript = preprocessing.clean_transcript(transcript)
    
    import time
    start_time = time.time()
    
    # Process transcript using parallel execution for speed
    logger.info("Initializing high-performance parallel synthesis...")
    
    with concurrent.futures.ThreadPoolExecutor() as executor:
        # Submit all independent intensive tasks
        future_summary = executor.submit(summarizer.generate_summary, cleaned_transcript)
        future_actions = executor.submit(extractor.extract_action_items, cleaned_transcript)
        future_sentiment = executor.submit(sentiment.analyze_sentiment, cleaned_transcript)
        # Note: Vector Embeddings are now offloaded to BackgroundTasks to prevent blocking
        
        # Collect results
        summary_text = future_summary.result()
        logger.info(f"Summary Synthesis: {time.time() - start_time:.2f}s")
        
        action_items_list = future_actions.result()
        logger.info(f"Action Extraction: {time.time() - start_time:.2f}s")
        
        meeting_sentiment = future_sentiment.result()
        logger.info(f"Sentiment Analysis: {time.time() - start_time:.2f}s")

    # Save to DB
    logger.info("Persisting to relational storage...")
    new_meeting = models.Meeting(title=title, transcript=cleaned_transcript)
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    
    db_summary = models.Summary(
        meeting_id=new_meeting.id, 
        content=summary_text,
        sentiment_label=meeting_sentiment["label"],
        sentiment_score=int(float(meeting_sentiment["score"]) * 100) # Save as percentage
    )
    db.add(db_summary)
    
    for item in action_items_list:
        db_item = models.ActionItem(
            meeting_id=new_meeting.id, 
            task=item["task"], 
            assignee=item.get("assignee"), 
            deadline=item.get("deadline")
        )
        db.add(db_item)
        
    db.commit()
    
    # Finalize Vector ID (Since we used -1 before, we should either update or just wait and store now)
    # Actually, it's safer to store with the REAL ID. Let's adjust the parallel block to wait for the ID first.
    # REVISED STRATEGY: RAG storage needs the ID, but embedding generation can start.
    # However, to keep it simple and robust, we'll wait for storage.
    
    logger.info(f"Relational Persistence complete: {time.time() - start_time:.2f}s")
    
    # NEURAL ASYNCHRONY: Offload vector storage (the heaviest part) to background
    logger.info("Offloading Neural Vector Storage to background task...")
    background_tasks.add_task(rag_engine.store_transcript_in_vector_db, new_meeting.id, cleaned_transcript)
    
    total_time = time.time() - start_time
    logger.info(f"--- TOTAL SYNTHESIS TIME: {total_time:.2f}s ---")
    
    # Consolidate response for immediate UI update (Reducing round-trip latency)
    return {
        "id": new_meeting.id,
        "title": new_meeting.title,
        "transcript": new_meeting.transcript,
        "created_at": new_meeting.created_at,
        "summary": summary_text,
        "sentiment_label": meeting_sentiment["label"],
        "sentiment_score": int(float(meeting_sentiment["score"]) * 100),
        "action_items": [
            {"task": item["task"], "assignee": item.get("assignee"), "deadline": item.get("deadline")} 
            for item in action_items_list
        ],
        "message": f"Strategic synthesis complete in {total_time:.2f}s."
    }

@app.get("/api/meetings")
def get_meetings(db: Session = Depends(get_db)):
    meetings = db.query(models.Meeting).order_by(models.Meeting.created_at.desc()).all()
    return [{"id": m.id, "title": m.title, "created_at": m.created_at} for m in meetings]

@app.get("/api/meetings/{meeting_id}")
def get_meeting_details(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    return {
        "id": meeting.id,
        "title": meeting.title,
        "transcript": meeting.transcript,
        "created_at": meeting.created_at,
        "summary": meeting.summary.content if meeting.summary else None,
        "sentiment_label": meeting.summary.sentiment_label if meeting.summary else None,
        "sentiment_score": meeting.summary.sentiment_score if meeting.summary else None,
        "action_items": [
            {"id": item.id, "task": item.task, "assignee": item.assignee, "deadline": item.deadline} 
            for item in meeting.action_items
        ]
    }
