"""
src/rag/ingestion/embedding_pipeline.py — Full RAG ingestion pipeline
======================================================================
Implements the complete Ingest → Embed → Index flow from the image workflow:

  Parse + chunk + clean  →  Google GenAI Embeddings  →  Pinecone metadata index

Includes:
  - Text cleaning (null bytes, non-printable chars, whitespace normalisation)
  - Duplicate detection: skip re-indexing a filename already indexed for user
  - Semantic or recursive chunking
  - Metadata enrichment
  - Pinecone indexing
"""
import re
from typing import List
from langchain_core.documents import Document
from src.rag.ingestion.chunking import semantic_chunk, recursive_chunk
from src.rag.ingestion.metadata_extractor import enrich_metadata
from src.core.logger import get_logger

logger = get_logger(__name__)



def clean_text(text: str) -> str:
    """
    Normalise raw text extracted from PDF/DOCX/TXT files.

    Steps:
      1. Strip null bytes and other control characters (except \\n\\t)
      2. Collapse runs of whitespace / blank lines
      3. Strip leading/trailing whitespace per line
    """
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = "\n".join(line.rstrip() for line in text.splitlines())
    return text.strip()


def clean_documents(documents: List[Document]) -> List[Document]:
    """Apply text cleaning to all documents in-place."""
    for doc in documents:
        doc.page_content = clean_text(doc.page_content)
    cleaned = [d for d in documents if len(d.page_content.strip()) > 50]
    logger.info(
        f"Cleaned {len(documents)} documents → "
        f"{len(cleaned)} non-empty (dropped {len(documents) - len(cleaned)})"
    )
    return cleaned




async def run_ingestion_pipeline(
    documents: List[Document],
    user_id: str,
    filename: str,
    vector_store,
    use_semantic_chunking: bool = True,
    allow_reindex: bool = False,
) -> int:
    """
    Full ingestion pipeline:
      1. Clean text (strip artefacts, normalise whitespace)
      2. Chunk (semantic paragraph-aware or recursive)
      3. Enrich metadata (user_id, filename, chunk_index, uploaded_at)
      4. Index into Pinecone via vector_store

    Args:
        documents:             LangChain Documents from the loader.
        user_id:               Owner's user ID — stored as Pinecone metadata.
        filename:              Original upload filename.
        vector_store:          PineconeVectorStore instance.
        use_semantic_chunking: Use paragraph-aware chunking (recommended).
        allow_reindex:         If False (default), skip if filename already
                               exists in this user's namespace.

    Returns:
        Number of chunks indexed (0 if skipped).
    """
    logger.info(
        f"Starting ingestion pipeline for '{filename}' "
        f"(user={user_id}, semantic={use_semantic_chunking})"
    )

    if not allow_reindex:
        try:
            index = vector_store.index
            stats = index.describe_index_stats()
            dimension = stats.dimension
            dummy_vector = [0.0] * dimension
            existing = index.query(
                vector=dummy_vector,
                filter={"user_id": user_id, "filename": filename},
                top_k=1,
            )
            if existing:
                matches = getattr(existing, "matches", None)
                if matches is None and isinstance(existing, dict):
                    matches = existing.get("matches")
                if matches:
                    logger.warning(
                        f"'{filename}' already indexed for user={user_id}. "
                        "Skipping re-index. Pass allow_reindex=True to override."
                    )
                    return 0
        except Exception as e:
            logger.debug(f"Duplicate check failed (non-fatal): {e}")

    documents = clean_documents(documents)
    if not documents:
        logger.warning(f"No usable content in '{filename}' after cleaning")
        return 0

    if use_semantic_chunking:
        chunks = semantic_chunk(documents)
    else:
        chunks = recursive_chunk(documents)

    if not chunks:
        logger.warning(f"No chunks produced for '{filename}'")
        return 0

    chunks = enrich_metadata(chunks, user_id=user_id, filename=filename)

    vector_store.add_documents(chunks)
    logger.info(f"Indexed {len(chunks)} chunks for '{filename}' (user={user_id})")

    return len(chunks)
