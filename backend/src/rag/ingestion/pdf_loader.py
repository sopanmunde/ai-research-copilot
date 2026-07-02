"""PDF document loader with metadata extraction."""
import os
import tempfile
from typing import List
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from src.core.logger import get_logger

logger = get_logger(__name__)


async def load_pdf(file_bytes: bytes, filename: str) -> List[Document]:
    """
    Load and parse a PDF file from bytes.
    Returns a list of LangChain Documents, one per page.
    """
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        loader = PyPDFLoader(tmp_path)
        docs = loader.load()

        for i, doc in enumerate(docs):
            doc.metadata.update({
                "filename": filename,
                "source": filename,
                "file_type": "pdf",
                "page": doc.metadata.get("page", i),
            })

        logger.info(f"Loaded PDF '{filename}': {len(docs)} pages")
        return docs

    except Exception as e:
        logger.error(f"Failed to load PDF '{filename}': {e}")
        raise
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
