from transformers import pipeline

print("Loading Sentiment Analysis Model...")
try:
    # Use a small, efficient model for fast CPU inference
    sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english", device=-1)
    print("Sentiment Model loaded successfully.")
except Exception as e:
    print(f"Failed to load Sentiment Model: {e}")
    sentiment_pipeline = None

def analyze_sentiment(text: str) -> dict:
    """
    Analyzes the sentiment of the provided meeting transcript.
    Returns a dict with 'label' (POSITIVE/NEGATIVE) and 'score' (0.0 to 1.0)
    """
    if not sentiment_pipeline or not text.strip():
        return {"label": "Neutral", "score": 0.0}
        
    try:
        # Truncate text to 512 tokens to avoid exceeding standard model context windows
        # For general meeting sentiment, reading the first ~512 words is usually indicative of tone.
        truncated_text = " ".join(text.split()[:400])
        result = sentiment_pipeline(truncated_text)[0]
        return {
            "label": result["label"],
            "score": result["score"]
        }
    except Exception as e:
        print(f"Sentiment Analysis Error: {e}")
        return {"label": "Neutral", "score": 0.0}
