from fastapi import APIRouter, status, Request, HTTPException
from schemas.contact import ContactCreate
from database.mongodb.repositories.contact_repository import save_contact_message
from core.limiter import limiter
from core.constants import RATE_LIMIT_CONTACT
from core.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

@router.post("", status_code=status.HTTP_201_CREATED, summary="Submit a contact form message")
@limiter.limit(RATE_LIMIT_CONTACT)
async def submit_contact_form(
    request: Request,
    contact: ContactCreate,
):
    try:
        inserted_id = await save_contact_message(contact)
        logger.info(f"Saved contact message {inserted_id} from {contact.email}")
        return {"message": "Message sent successfully!"}
    except Exception as e:
        logger.error(f"Failed to save contact message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save message. Please try again later."
        )
