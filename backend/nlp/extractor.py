import nltk
import re

# Ensure standard NLTK models are available to prevent runtime hangs
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('taggers/averaged_perceptron_tagger_eng')
except LookupError:
    nltk.download('averaged_perceptron_tagger_eng')

try:
    nltk.data.find('chunkers/maxent_ne_chunker')
except LookupError:
    nltk.download('maxent_ne_chunker_tab')

try:
    nltk.data.find('corpora/words')
except LookupError:
    nltk.download('words')

def extract_action_items(text: str) -> list[dict]:
    """
    Extracts action items from transcripts using NLTK (POS Tagging and NER).
    """
    sentences = nltk.sent_tokenize(text)
    action_items = []
    
    indicators = ['will', 'need', 'must', 'should', 'going to', 'prepare', 'schedule', 'finalize']
    
    for sent in sentences:
        sent_lower = sent.lower()
        if any(ind in sent_lower for ind in indicators):
            # We found a potential action item. Let's do NER using NLTK
            words = nltk.word_tokenize(sent)
            tagged = nltk.pos_tag(words)
            chunks = nltk.ne_chunk(tagged)
            
            assignee = "Unknown"
            
            # Simple NER traversal for PERSON
            for chunk in chunks:
                if hasattr(chunk, 'label') and chunk.label() == 'PERSON':
                    if assignee == "Unknown":
                        assignee = " ".join(c[0] for c in chunk)
                        
            # If NLTK NER didn't catch it, we can fallback to speaker heuristics
            if assignee == "Unknown" and ":" in sent:
                parts = sent.split(":", 1)
                if len(parts[0].split()) <= 2:
                    assignee = parts[0].strip()
                    
            # Fallback Date/Time detection using regex
            deadline = "None"
            date_patterns = [
                r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
                r'\b(tomorrow|today)\b',
                r'\b(\d{1,2}(st|nd|rd|th)? (january|february|march|april|may|june|july|august|september|october|november|december))\b'
            ]
            
            for pat in date_patterns:
                match = re.search(pat, sent_lower)
                if match:
                    deadline = match.group(0)
                    break
                    
            action_items.append({
                "task": sent.strip(),
                "assignee": assignee.title() if assignee != "Unknown" else assignee,
                "deadline": deadline.title() if deadline != "None" else deadline
            })
            
    return action_items
