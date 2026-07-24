"""
src/agents/langgraph/nodes/vision_extraction_node.py — Vision Extraction Agent & Service
========================================================================================
Extracts structured layout-preserved OCR, JSON charts, Markdown tables, or medical descriptions
from images and scanned PDFs using Google Gemini / GPT-4 Vision models.
"""
import base64
from typing import List, Dict, Any, Optional
from langchain_core.messages import HumanMessage
from langchain_core.documents import Document

from agents.langgraph.state import AgentState
from core.llm_factory import get_llm, get_fallback_providers
from agents.langgraph.nodes.utils import extract_text
from core.logger import get_logger
from database.mongodb.connection import get_database
from core.constants import COLLECTION_DOCUMENTS

logger = get_logger(__name__)

# Prompts optimized for various multi-modal extraction tasks
OCR_PROMPT = """Analyze this image of a scanned document/page. Extract all text from it using high-accuracy OCR.
Preserve the layout, headings, structure, lists, columns, and paragraphs. Format the output in clean, readable Markdown.
Do not include any chat prefix, conversational filler, or markdown code block wrapper (like ```markdown), just return the clean text of the document."""

CHART_PROMPT = """Analyze this chart/graph image. Extract all the underlying data and key visual components.
Format the output as a structured JSON object containing:
- title: Title of the chart
- type: Type of chart (e.g., bar, line, pie, scatter, area)
- axes: Details of X and Y axes (labels, units, scale)
- data_points: An array/list of data points, each being a dict with labels/categories and values
- trend_summary: A 1-2 sentence summary of the key trend, pattern, or main takeaway
Return ONLY the raw JSON string. Do not wrap in a ```json code block or include any conversational intro/outro."""

TABLE_PROMPT = """Analyze this image of a table. Extract the table contents exactly.
Format the output as a clean, queryable Markdown table (with header row, alignment dividers, and data rows).
Ensure all columns, names, numbers, and alignments match the image perfectly.
Do not include any chat prefix or markdown code block wrapper, just return the clean Markdown table."""

MEDICAL_PROMPT = """Analyze this medical scan / clinical image. Provide a detailed clinical description.
Focus on:
1. Scan Type (e.g., X-ray, MRI, CT, Ultrasound, Pathology slide) and anatomical region
2. Observations: Detail any visual findings, abnormalities, lesions, fractures, masses, or notable features
3. Structured metadata or clinical parameters visible (labels, arrows, annotations)
Return the response in clean, professional markdown format suitable for a clinical summary.
Maintain clinical language, and state clearly that this is an AI-extracted description from a visual source.
Avoid diagnosing; describe visual features and patterns accurately."""

AUTO_PROMPT = """Analyze this image. Perform high-accuracy OCR to extract any text, preserving its layout/markdown.
- If it is a scanned document page, return the layout-preserved text in clean Markdown.
- If it is a chart/graph, extract data points and format them as a structured JSON object.
- If it is a table, format it as a queryable Markdown table.
- If it is a medical scan, provide a clinical description.
Return the output directly. Do not wrap in markdown code blocks or add chat prefixes/introductory text."""


def encode_image_base64(content: bytes) -> str:
    """Encode raw image bytes to a base64 UTF-8 string."""
    return base64.b64encode(content).decode("utf-8")


async def extract_vision_data(
    content: bytes,
    filename: str,
    file_type: str,
    extraction_type: str = "auto",
    provider: str = None,
    model_name: str = None
) -> str:
    """
    Orchestrates the multi-modal vision call to extract structured information.
    Uses fallback providers on rate limits or API issues.
    """
    logger.info(
        f"[Vision Extraction] Extracting data from '{filename}' (type={extraction_type}, provider={provider or 'default'})"
    )

    # 1. Determine Mime Type
    ext = file_type.lower().strip().replace(".", "")
    mime_type = "image/png"
    if ext in ("jpg", "jpeg"):
        mime_type = "image/jpeg"
    elif ext == "webp":
        mime_type = "image/webp"
    elif ext == "gif":
        mime_type = "image/gif"
    elif ext == "bmp":
        mime_type = "image/bmp"
    elif ext == "svg":
        mime_type = "image/svg+xml"

    # 2. Select Prompt
    prompts_map = {
        "scanned_pdf": OCR_PROMPT,
        "ocr": OCR_PROMPT,
        "chart": CHART_PROMPT,
        "table": TABLE_PROMPT,
        "medical_image": MEDICAL_PROMPT,
        "auto": AUTO_PROMPT
    }
    prompt = prompts_map.get(extraction_type.lower(), AUTO_PROMPT)

    # 3. Create Multi-Modal Message Payload
    base64_img = encode_image_base64(content)
    data_uri = f"data:{mime_type};base64,{base64_img}"

    message = HumanMessage(
        content=[
            {"type": "text", "text": prompt},
            {
                "type": "image_url",
                "image_url": {"url": data_uri},
            },
        ]
    )

    # 4. Multi-LLM Provider Failover Loop
    fallback_providers = get_fallback_providers(provider or "google")
    extracted_text = ""
    last_error = None

    for attempt_idx, attempt_provider in enumerate(fallback_providers):
        try:
            if attempt_idx > 0:
                logger.warning(
                    f"[Vision Extraction] Failing over: {fallback_providers[attempt_idx-1]} -> {attempt_provider}"
                )

            # Resolve model override or fall back to default
            attempt_model = model_name if attempt_idx == 0 else ""
            if not attempt_model:
                if attempt_provider == "google":
                    attempt_model = "gemini-2.5-flash"
                elif attempt_provider == "openai":
                    attempt_model = "gpt-4o"

            llm = get_llm(
                provider=attempt_provider,
                model_name=attempt_model,
                temperature=0.1,
                streaming=False
            )

            response = await llm.ainvoke([message])
            extracted_text = extract_text(response.content).strip()
            if extracted_text:
                logger.info(
                    f"[Vision Extraction] Success using {attempt_provider} ({attempt_model}). Length: {len(extracted_text)}"
                )
                break
        except Exception as e:
            last_error = e
            logger.error(f"[Vision Extraction] Provider '{attempt_provider}' error: {e}")
            continue

    if not extracted_text:
        if last_error:
            raise last_error
        raise RuntimeError("Vision extraction failed on all available providers.")

    return extracted_text


async def extract_scanned_pdf(
    pdf_bytes: bytes,
    filename: str,
    provider: str = None,
    model_name: str = None
) -> List[Document]:
    """
    Extracts structured layout-preserved text from scanned PDFs.
    Uses native Google Gemini PDF support when using the Google provider.
    Otherwise, renders PDF pages into images page-by-page using fitz (PyMuPDF) and does OCR.
    """
    resolved_provider = (provider or "google").lower().strip()
    
    if resolved_provider == "google":
        logger.info(f"[Vision Extraction] Using native Gemini PDF processing for '{filename}'")
        try:
            base64_pdf = base64.b64encode(pdf_bytes).decode("utf-8")
            message = HumanMessage(
                content=[
                    {"type": "text", "text": OCR_PROMPT},
                    {
                        "type": "media",
                        "mime_type": "application/pdf",
                        "data": base64_pdf
                    }
                ]
            )
            
            llm = get_llm(
                provider="google",
                model_name=model_name or "gemini-2.5-flash",
                temperature=0.1,
                streaming=False
            )
            
            response = await llm.ainvoke([message])
            extracted_text = extract_text(response.content).strip()
            
            if extracted_text:
                logger.info(f"[Vision Extraction] Successfully extracted scanned PDF '{filename}' using native Gemini support.")
                return [Document(
                    page_content=extracted_text,
                    metadata={
                        "filename": filename,
                        "source": filename,
                        "file_type": "pdf",
                        "page": 0,
                        "is_scanned": True,
                        "extracted_via": "gemini_direct_pdf"
                    }
                )]
        except Exception as e:
            logger.warning(f"[Vision Extraction] Gemini native PDF extraction failed: {e}. Falling back to image rendering.")

    # Fallback to page-by-page image rendering OCR
    logger.info(f"[Vision Extraction] Loading PDF '{filename}' pages for page-by-page image rendering")

    try:
        import fitz  # PyMuPDF
    except Exception as e:
        logger.error(
            f"[Vision Extraction] Failed to import PyMuPDF (fitz): {e}. "
            f"Scanned PDF extraction is not supported in this environment. Falling back to text-based extraction."
        )
        from rag.ingestion.pdf_loader import load_pdf
        return await load_pdf(pdf_bytes, filename)

    documents: List[Document] = []
    try:
        pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        num_pages = len(pdf_doc)
        logger.info(f"[Vision Extraction] Total PDF pages to render: {num_pages}")

        for page_num in range(num_pages):
            page = pdf_doc.load_page(page_num)
            
            # Matrix(2, 2) scales page by 2x for highly readable OCR resolution
            zoom = 2.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            image_bytes = pix.tobytes("png")

            page_text = await extract_vision_data(
                content=image_bytes,
                filename=filename,
                file_type="png",
                extraction_type="scanned_pdf",
                provider=provider,
                model_name=model_name
            )

            doc = Document(
                page_content=page_text,
                metadata={
                    "filename": filename,
                    "source": filename,
                    "file_type": "pdf",
                    "page": page_num,
                    "is_scanned": True,
                }
            )
            documents.append(doc)
            logger.info(f"[Vision Extraction] Processed page {page_num + 1}/{num_pages}")

    except Exception as e:
        logger.error(f"[Vision Extraction] Failed to process scanned PDF '{filename}': {e}", exc_info=True)
        raise

    return documents


async def vision_extraction_node(state: AgentState) -> dict:
    """
    LangGraph node: vision_extractor.
    Fetches the raw document bytes from MongoDB based on filename and user_id,
    performs multi-modal vision extraction on-the-fly, and updates 'analysis_results'.
    """
    filename = state.get("filename")
    user_id = state.get("user_id")
    provider = state.get("selected_llm_provider")
    model_name = state.get("selected_llm_model")

    if not filename:
        logger.info("[Vision Node] No filename in graph state — skipping vision extraction")
        return {"current_node": "vision_extractor"}

    logger.info(f"[Vision Node] Starting vision node for '{filename}' (user={user_id})")

    db = get_database()
    doc = await db[COLLECTION_DOCUMENTS].find_one({
        "user_id": user_id,
        "filename": filename
    })

    if not doc or "file_bytes" not in doc:
        logger.warning(f"[Vision Node] File '{filename}' not found or missing bytes in DB")
        return {
            "current_node": "vision_extractor",
            "errors": state.get("errors", []) + [f"File '{filename}' could not be retrieved from database."]
        }

    file_bytes = bytes(doc["file_bytes"])
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    IMAGE_EXTS = {"png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff", "svg"}

    try:
        if ext == "pdf":
            docs = await extract_scanned_pdf(file_bytes, filename, provider=provider, model_name=model_name)
            extracted_text = "\n\n--- Page Break ---\n\n".join(d.page_content for d in docs)
        elif ext in IMAGE_EXTS:
            # Map query keywords to specific extraction prompts for higher accuracy
            query = state.get("query", "").lower()
            extraction_type = "auto"
            if "chart" in query or "graph" in query or "chart" in filename.lower():
                extraction_type = "chart"
            elif "table" in query or "spreadsheet" in query or "table" in filename.lower():
                extraction_type = "table"
            elif any(k in query for k in ("medical", "scan", "clinical", "xray", "mri", "ct", "pathology")):
                extraction_type = "medical_image"

            extracted_text = await extract_vision_data(
                content=file_bytes,
                filename=filename,
                file_type=ext,
                extraction_type=extraction_type,
                provider=provider,
                model_name=model_name
            )
        else:
            logger.info(f"[Vision Node] Format '.{ext}' not supported for vision extraction — skipping")
            return {"current_node": "vision_extractor"}

        return {
            "analysis_results": extracted_text,
            "current_node": "vision_extractor",
        }

    except Exception as e:
        logger.error(f"[Vision Node] Failed to extract '{filename}': {e}", exc_info=True)
        return {
            "current_node": "vision_extractor",
            "errors": state.get("errors", []) + [f"Vision extraction failed for {filename}: {str(e)}"]
        }
