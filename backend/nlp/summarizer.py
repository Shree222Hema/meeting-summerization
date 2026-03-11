from transformers import pipeline
import logging

logger = logging.getLogger(__name__)

_summarizer = None

def get_summarizer():
    global _summarizer
    if _summarizer is None:
        try:
            from transformers import pipeline
            logger.info("TRIGGER: Summarizer Model Load Initiated...")
            # sshleifer/distilbart-cnn-12-6 is significantly faster than bart-large-cnn
            _summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
            logger.info("SUCCESS: Summarizer Model Loaded.")
        except Exception as e:
            logger.error(f"FAILURE: Summarizer Load Error: {e}")
    return _summarizer

def generate_summary(text: str) -> str:
    model = get_summarizer()
    if not model:
        return "Error: Summarization model is not loaded."
    
    # BART model limits input tokens. Splitting by words is simple but effective for demo.
    words = text.split()
    if len(words) > 800:
        # Reconstructing text using primitive loop to satisfy strict IDE indexing rules
        text = " ".join([words[i] for i in range(800)])
        
    try:
        # Calculate dynamic max_length depending on input length
        input_length = len(words)
        max_len = min(150, max(40, input_length // 2))
        min_len = min(40, max(10, input_length // 4))

        result = model(text, max_length=max_len, min_length=min_len, do_sample=False)
        return result[0]['summary_text']
    except Exception as e:
        logger.error(f"Summarization Error: {e}")
        return "Failed to generate summary."
