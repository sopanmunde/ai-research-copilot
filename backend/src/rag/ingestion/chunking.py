"""Intelligent chunking strategies for document ingestion."""
from typing import List
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from src.core.config import settings
from src.core.logger import get_logger

logger = get_logger(__name__)


def recursive_chunk(
    documents: List[Document],
    chunk_size: int = None,
    chunk_overlap: int = None,
) -> List[Document]:
    """
    Recursively split documents using character-level boundaries.
    Preserves metadata from source documents.
    """
    chunk_size = chunk_size or settings.CHUNK_SIZE
    chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = splitter.split_documents(documents)
    logger.info(f"Chunked {len(documents)} doc(s) → {len(chunks)} chunks "
                f"(size={chunk_size}, overlap={chunk_overlap})")
    return chunks


def semantic_chunk(
    documents: List[Document],
    chunk_size: int = None,
    chunk_overlap: int = None,
) -> List[Document]:
    """
    Semantic-aware chunking: splits on paragraph/section boundaries first,
    then falls back to recursive splitting for large sections.
    """
    chunk_size = chunk_size or settings.CHUNK_SIZE
    chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

    paragraph_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size * 3,
        chunk_overlap=0,
        separators=["\n\n\n", "\n\n"],
    )
    fine_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n", ". ", " ", ""],
    )

    paragraphs = paragraph_splitter.split_documents(documents)
    chunks = fine_splitter.split_documents(paragraphs)

    logger.info(f"Semantic chunked {len(documents)} doc(s) → "
                f"{len(paragraphs)} paragraphs → {len(chunks)} final chunks")
    return chunks
