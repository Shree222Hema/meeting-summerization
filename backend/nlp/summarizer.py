from transformers import pipeline

# Load summarizer pipeline globally
summarizer = None
try:
    print("Loading HuggingFace BART Model...")
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    print("Model loaded successfully.")
except Exception as e:
    print(f"Failed to load summarizer: {e}")

def generate_summary(text: str) -> str:
    if not summarizer:
        return "Error: Summarization model is not loaded."
    
    # BART model limits input tokens. Splitting by words is simple but effective for demo.
    max_chunk = 800
    words = text.split()
    if len(words) > max_chunk:
        text = " ".join(words[:max_chunk])
        
    try:
        # Calculate dynamic max_length depending on input length
        input_length = len(text.split())
        max_len = min(150, max(40, input_length // 2))
        min_len = min(40, max(10, input_length // 4))

        result = summarizer(text, max_length=max_len, min_length=min_len, do_sample=False)
        return result[0]['summary_text']
    except Exception as e:
        print(f"Summarization Error: {e}")
        return "Failed to generate summary."
