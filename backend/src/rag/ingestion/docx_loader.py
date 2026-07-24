"""DOCX document loader with metadata extraction."""
import os
import tempfile
from typing import List
from langchain_community.document_loaders import Docx2txtLoader
from langchain_core.documents import Document
from core.logger import get_logger

logger = get_logger(__name__)


async def load_docx(file_bytes: bytes, filename: str) -> List[Document]:
    """
    Load and parse a DOCX file from bytes.
    Returns a list of LangChain Documents.
    """
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        loader = Docx2txtLoader(tmp_path)
        docs = loader.load()

        for doc in docs:
            doc.metadata.update({
                "filename": filename,
                "source": filename,
                "file_type": "docx",
            })

        logger.info(f"Loaded DOCX '{filename}': {len(docs)} document(s)")
        return docs

    except Exception as e:
        logger.error(f"Failed to load DOCX '{filename}': {e}")
        raise
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
