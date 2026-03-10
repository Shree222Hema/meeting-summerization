import re

def clean_transcript(text: str) -> str:
    """
    Cleans the raw meeting transcript by removing extra whitespaces
    and unwanted characters.
    """
    text = re.sub(r'\s+', ' ', text)
    return text.strip()
