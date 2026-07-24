import os
import sys
import base64
from dotenv import load_dotenv

# Load env vars
load_dotenv()

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest

@pytest.mark.asyncio
async def test_direct_pdf():
    from core.llm_factory import get_llm
    
    # Create a tiny 1-page PDF file with dummy bytes or write dummy PDF
    dummy_pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n180\n%%EOF\n"
    
    encoded_pdf = base64.b64encode(dummy_pdf_content).decode("utf-8")
    
    from langchain_core.messages import HumanMessage
    
    # In langchain-google-genai, the format for passing media files can use the standard langchain media dict
    message = HumanMessage(
        content=[
            {"type": "text", "text": "Describe this PDF document:"},
            {
                "type": "media",
                "mime_type": "application/pdf",
                "data": encoded_pdf
            }
        ]
    )
    
    try:
        llm = get_llm(provider="google", model_name="gemini-2.5-flash", temperature=0.1, streaming=False)
        print("Invoking Gemini with PDF...")
        response = await llm.ainvoke([message])
        print("Success! Gemini response:")
        print(response.content)
    except Exception as e:
        print("Gemini PDF failed:", e)

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_direct_pdf())
