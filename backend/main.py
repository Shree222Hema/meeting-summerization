from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, Body
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import logging
import PyPDF2
import docx
import io

import os
import shutil
import subprocess
import models
from database import engine, get_db
from nlp import preprocessing, summarizer, extractor, transcriber, sentiment, rag_engine

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables and DB
models.Base.metadata.create_all(bind=engine)

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
    
    # 3. Generate Answer (using a fast transformers text2text pipeline)
    try:
        from transformers import pipeline
        # Using a very tiny T5 model for CPU speed
        qa_pipeline = pipeline("text2text-generation", model="google/flan-t5-small", device=-1)
        answer = qa_pipeline(prompt, max_length=150, do_sample=False)[0]['generated_text']
        
        # Format sources to return to UI
        sources = list(set([c['meeting_id'] for c in relevant_chunks]))
        
        return {
            "answer": answer,
            "sources": sources
        }
    except Exception as e:
        logger.error(f"Chat LLM Error: {e}")
        return {"answer": "Error generating answer from context.", "sources": []}

@app.post("/api/meetings/upload")
async def upload_meeting(
    title: str = Form(...), 
    file: UploadFile = File(None), 
    text: str = Form(None), 
    url: str = Form(None),
    db: Session = Depends(get_db)
):
    if not file and not text and not url:
        raise HTTPException(status_code=400, detail="Either file, text, or url must be provided.")
        
    transcript = ""
    
    if url:
        logger.info(f"Downloading audio from URL: {url}")
        temp_audio = "temp_download.wav"
        try:
            # yt-dlp config to extract audio
            subprocess.run([
                "yt-dlp",
                "-f", "bestaudio/best",
                "-x", "--audio-format", "wav",
                "-o", "temp_download.%(ext)s",
                url
            ], check=True)
            
            logger.info("Transcribing downloaded audio...")
            transcript = transcriber.transcribe_audio(temp_audio)
        except Exception as e:
            logger.error(f"Failed to process URL: {e}")
            raise HTTPException(status_code=400, detail="Failed to extract audio from provided URL.")
        finally:
            if os.path.exists(temp_audio):
                os.remove(temp_audio)
                
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
    
    logger.info("Generating summary...")
    summary_text = summarizer.generate_summary(cleaned_transcript)
    
    logger.info("Extracting action items...")
    action_items_list = extractor.extract_action_items(cleaned_transcript)
    
    logger.info("Analyzing sentiment...")
    meeting_sentiment = sentiment.analyze_sentiment(cleaned_transcript)
    
    # Save to DB
    logger.info("Saving to database...")
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
    
    # Send transcript to Vector DB for future Chat/RAG queries
    logger.info("Storing transcript in ChromaDB Vector Storage...")
    try:
        rag_engine.store_transcript_in_vector_db(new_meeting.id, cleaned_transcript)
    except Exception as e:
        logger.error(f"Failed to store in Vector DB: {e}")
    
    return {"meeting_id": new_meeting.id, "message": "Meeting processed successfully."}

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
