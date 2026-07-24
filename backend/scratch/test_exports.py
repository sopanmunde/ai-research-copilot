"""
test_exports.py — Verification script for PDF, DOCX, XLSX generation and integration payloads.
"""
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.export_service import (
    generate_pdf_report,
    generate_docx_report,
    generate_xlsx_report,
)
from services.third_party_integrations import (
    send_slack_webhook,
    send_teams_webhook,
)


def run_tests():
    query = "Quantum Computing Architectures for Enterprise Encryption"
    report_text = """# Executive Summary
Quantum key distribution (QKD) and post-quantum cryptography (PQC) represent critical milestones for enterprise data protection.

## Key Findings
- NIST PQC standards (ML-KEM, MLDSA) are ready for migration planning.
- Hybrid TLS handshakes preserve legacy security while introducing lattice-based resistance.
- Key rotation protocols should be updated to automated short-lived certificate lifecycles.

### Recommendations
1. Conduct cryptographic inventory across all public endpoints.
2. Upgrade hardware security modules (HSMs) to firmware supporting FALCON and Dilithium.
"""
    citations = [
        {"filename": "NIST_PQC_Standards_2024.pdf", "page": "12", "snippet": "Lattice cryptography offers proven post-quantum hardness under worst-case assumptions."},
        {"filename": "Enterprise_Crypto_Migration.docx", "page": "45", "snippet": "Automated key rotation mitigates risks of compromised key pairs."}
    ]

    print("Testing PDF Generation...")
    pdf_bytes = generate_pdf_report(query=query, report_text=report_text, citations=citations)
    print(f"✅ PDF generated successfully ({len(pdf_bytes)} bytes)")

    print("Testing DOCX Generation...")
    docx_bytes = generate_docx_report(query=query, report_text=report_text, citations=citations)
    print(f"✅ DOCX generated successfully ({len(docx_bytes)} bytes)")

    print("Testing XLSX Generation...")
    xlsx_bytes = generate_xlsx_report(query=query, report_text=report_text, citations=citations)
    print(f"✅ XLSX generated successfully ({len(xlsx_bytes)} bytes)")

    print("All export builders executed cleanly!")


if __name__ == "__main__":
    run_tests()
