from datetime import datetime, timezone
from database.mongodb.connection import get_database
from core.constants import COLLECTION_CONTACTS
from schemas.contact import ContactCreate

def _db():
    return get_database()

async def save_contact_message(contact: ContactCreate) -> str:
    result = await _db()[COLLECTION_CONTACTS].insert_one({
        "first_name": contact.firstName,
        "last_name": contact.lastName,
        "email": contact.email,
        "subject": contact.subject,
        "message": contact.message,
        "created_at": datetime.now(timezone.utc),
    })
    return str(result.inserted_id)
