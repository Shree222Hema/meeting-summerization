from transformers import pipeline
import logging

logger = logging.getLogger(__name__)

_sentiment_pipeline = None

def get_sentiment_pipeline():
    global _sentiment_pipeline
    if _sentiment_pipeline is None:
        try:
            from transformers import pipeline
            logger.info("TRIGGER: Sentiment Model Load Initiated...")
            # Use a small, efficient model for fast CPU inference
            _sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english", device=-1)
            logger.info("SUCCESS: Sentiment Model Loaded.")
        except Exception as e:
            logger.error(f"FAILURE: Sentiment Load Error: {e}")
    return _sentiment_pipeline

def analyze_sentiment(text: str) -> dict:
    """
    Analyzes the sentiment of the provided meeting transcript.
    Returns a dict with 'label' (POSITIVE/NEGATIVE) and 'score' (0.0 to 1.0)
    """
    model = get_sentiment_pipeline()
    if not model or not text.strip():
        return {"label": "Neutral", "score": 0.0}
        
    try:
        # Truncate text to 512 tokens to avoid exceeding standard model context windows
        words = text.split()
        if len(words) > 400:
            truncated_text = " ".join([words[i] for i in range(400)])
        else:
            truncated_text = text
            
        result = model(truncated_text)[0]
        return {
            "label": result["label"],
            "score": result["score"]
        }
    except Exception as e:
        logger.error(f"Sentiment Analysis Error: {e}")
        return {"label": "Neutral", "score": 0.0}
