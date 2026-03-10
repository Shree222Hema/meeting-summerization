import chromadb
from chromadb.config import Settings
from langchain_huggingface import HuggingFaceEmbeddings
import logging

logger = logging.getLogger(__name__)

# Initialize ChromaDB client to store data locally
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# Create or get the collection for meetings
collection_name = "meeting_transcripts"
collection = chroma_client.get_or_create_collection(
    name=collection_name,
    metadata={"hnsw:space": "cosine"}
)

# Load the local embedding model
# all-MiniLM-L6-v2 is an excellent, tiny model for fast semantic search on CPUs
print("Loading Embedding Model...")
try:
    embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    print("Embedding Model loaded successfully.")
except Exception as e:
    print(f"Failed to load Embedding Model: {e}")
    embeddings_model = None

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list:
    """
    Splits a large transcript down into overlapping chunks suitable for semantic search.
    """
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def store_transcript_in_vector_db(meeting_id: int, transcript: str):
    """
    Chunks a transcript, generates embeddings, and saves them to ChromaDB.
    """
    if not embeddings_model:
        logger.error("Embedding model not loaded. Skipping vector storage.")
        return

    logger.info(f"Chunking transcript for Meeting {meeting_id}...")
    chunks = chunk_text(transcript)
    
    if not chunks:
        return

    logger.info(f"Generated {len(chunks)} chunks. Creating embeddings...")
    embeddings = embeddings_model.embed_documents(chunks)

    # Prepare data for ChromaDB
    ids = [f"meeting_{meeting_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"meeting_id": meeting_id, "chunk_index": i} for i in range(len(chunks))]

    logger.info("Storing vectors in ChromaDB...")
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas
    )

def query_meetings(query: str, top_k: int = 3) -> list:
    """
    Finds the most relevant meeting chunks given a user's question.
    """
    if not embeddings_model:
        return []

    logger.info(f"Embedding query: {query}")
    query_embedding = embeddings_model.embed_query(query)

    logger.info("Searching ChromaDB...")
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k
    )

    if not results or not results["documents"] or not results["documents"][0]:
        return []

    # Format results
    retrieved_chunks = []
    for i in range(len(results["documents"][0])):
        retrieved_chunks.append({
            "content": results["documents"][0][i],
            "meeting_id": results["metadatas"][0][i]["meeting_id"]
        })
        
    return retrieved_chunks
