"""Contextual retriever — uses LangChain ContextualCompressionRetriever to reduce noise."""
from typing import List, Optional, Dict
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain_core.documents import Document
from rag.vectorstores.pinecone_store import get_mmr_retriever
from core.logger import get_logger

logger = get_logger(__name__)


def get_contextual_retriever(
    llm,
    top_k: int = 6,
    filter: Optional[Dict] = None,
) -> ContextualCompressionRetriever:
    """
    Builds a contextual compression retriever that:
      1. Fetches documents using MMR retriever (diverse, relevant)
      2. Compresses each chunk to only the parts relevant to the query
    """
    base_retriever = get_mmr_retriever(top_k=top_k, filter=filter)
    compressor = LLMChainExtractor.from_llm(llm)
    return ContextualCompressionRetriever(
        base_compressor=compressor,
        base_retriever=base_retriever,
    )


def contextual_search(
    query: str,
    llm,
    top_k: int = 6,
    filter: Optional[Dict] = None,
) -> List[Document]:
    """Run contextual compression retrieval for a query."""
    retriever = get_contextual_retriever(llm=llm, top_k=top_k, filter=filter)
    docs = retriever.invoke(query)
    logger.info(f"Contextual retrieval '{query[:60]}' → {len(docs)} compressed docs")
    return docs
