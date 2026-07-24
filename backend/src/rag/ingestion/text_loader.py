"""Plain text document loader."""
from typing import List
from langchain_core.documents import Document
from core.logger import get_logger

logger = get_logger(__name__)


async def load_text(file_bytes: bytes, filename: str) -> List[Document]:
    """
    Load a plain text file from bytes.
    Returns a single LangChain Document.
    """
    try:
        content = file_bytes.decode("utf-8", errors="replace")
        doc = Document(
            page_content=content,
            metadata={
                "filename": filename,
                "source": filename,
                "file_type": "txt",
                "page": 0,
            }
        )
        logger.info(f"Loaded TXT '{filename}': {len(content)} chars")
        return [doc]
    except Exception as e:
        logger.error(f"Failed to load TXT '{filename}': {e}")
        raise
