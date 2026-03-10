import whisper
import os

# Load Whisper model globally to prevent reloading on each request
model = None
try:
    print("Loading Whisper tiny model...")
    model = whisper.load_model("tiny")
    print("Whisper model loaded successfully.")
except Exception as e:
    print(f"Failed to load Whisper model: {e}")

def transcribe_audio(file_path: str) -> str:
    """
    Transcribes audio file to text using OpenAI Whisper.
    """
    if not model:
        return "Error: Whisper model is not loaded."
    
    try:
        # result contains "text", "segments", "language"
        result = model.transcribe(file_path)
        return result["text"].strip()
    except Exception as e:
        print(f"Transcription Error: {e}")
        return "Failed to transcribe audio."
