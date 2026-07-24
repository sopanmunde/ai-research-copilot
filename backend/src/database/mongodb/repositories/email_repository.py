"""Email repository — CRUD database helpers for emails in MongoDB."""
from datetime import datetime, timezone
from typing import List, Dict, Optional
from bson.objectid import ObjectId
from database.mongodb.connection import get_database
from core.constants import COLLECTION_EMAILS
from core.logger import get_logger

logger = get_logger(__name__)


def _db():
    return get_database()


def clean_email(email: Dict) -> Dict:
    if not email:
        return email
    if "_id" in email:
        email["id"] = str(email.pop("_id"))
    return email


def get_seed_emails() -> List[Dict]:
    return [
        {
            "name": "Sopan Munde",
            "email": "sopan@example.com",
            "subject": "Meeting Tomorrow",
            "date": "4 months ago",
            "fullDate": "Oct 22, 2023, 9:00:00 AM",
            "snippet": "Hi, let's have a meeting tomorrow to discuss the project. I've been reviewing the project details and have some ideas I'd like to share. It's crucial that we align on our next steps...",
            "body": "Hi, let's have a meeting tomorrow to discuss the project. I've been reviewing the project details and have some ideas I'd like to share. It's crucial that we align on our next steps to ensure the project's success.\n\nPlease come prepared with any questions or insights you may have. Looking forward to our meeting!\n\nBest regards,\nWilliam",
            "tags": ["meeting", "work", "important"],
            "unread": False,
            "favorite": True,
            "folder": "inbox",
            "category": "updates"
        },
        {
            "name": "Vicky Jadhav",
            "email": "vicky@example.com",
            "subject": "Re: Project Update",
            "date": "4 months ago",
            "fullDate": "Oct 20, 2023, 2:15:00 PM",
            "snippet": "Thank you for the project update. It looks great! I've gone through the report, and the progress is impressive. The team has done a fantastic job of meeting our milestones...",
            "body": "Thank you for the project update. It looks great! I've gone through the report, and the progress is impressive. The team has done a fantastic job of meeting our milestones on time.\n\nI have a few small comments on the dashboard component spacing, but overall it is ready for review. Let's schedule a brief sync to finalize deployment.\n\nThanks,\nAlice",
            "tags": ["work", "important"],
            "unread": True,
            "favorite": False,
            "folder": "inbox",
            "category": "updates"
        },
        {
            "name": "Krushana Kalamkar",
            "email": "krushana@example.com",
            "subject": "Weekend Plans",
            "date": "about 3 years ago",
            "fullDate": "Jun 12, 2021, 11:30:00 AM",
            "snippet": "Any plans for the weekend? I was thinking of going hiking in the nearby mountains. It's been a while since we had some outdoor fun. If you're interested, let me know, and we...",
            "body": "Any plans for the weekend? I was thinking of going hiking in the nearby mountains. It's been a while since we had some outdoor fun. If you're interested, let me know, and we can plan the details.\n\nI was looking at the Mount Mitchell trail which has excellent views. Weather forecast looks sunny!\n\nCheers,\nBob",
            "tags": ["personal"],
            "unread": False,
            "favorite": True,
            "folder": "inbox",
            "category": "social"
        },
        {
            "name": "Aditya Bhayar",
            "email": "aditya@example.com",
            "subject": "Re: Question about Budget",
            "date": "over 3 years ago",
            "fullDate": "Apr 5, 2021, 4:45:00 PM",
            "snippet": "I have a question about the budget for the upcoming project. It seems like there's a discrepancy in the allocation of resources. I've reviewed the budget report and noticed...",
            "body": "I have a question about the budget for the upcoming project. It seems like there's a discrepancy in the allocation of resources. I've reviewed the budget report and noticed that design engineering is allocated 15% less than originally agreed.\n\nCould we review the spreadsheet together sometime tomorrow morning?\n\nBest,\nEmily",
            "tags": ["work", "budget"],
            "unread": False,
            "favorite": False,
            "folder": "inbox",
            "category": "forums"
        },
        {
            "name": "Piyush Manmode",
            "email": "piyush@example.com",
            "subject": "Important Announcement",
            "date": "over 3 years ago",
            "fullDate": "Mar 10, 2021, 3:00:00 PM",
            "snippet": "I have an important announcement to make during our team meeting. It pertains to a strategic shift in our approach to the upcoming product launch. We've received valuable...",
            "body": "I have an important announcement to make during our team meeting. It pertains to a strategic shift in our approach to the upcoming product launch. We've received valuable feedback from our beta testers, and I believe it's time to make some adjustments to better meet our customers' needs.\n\nThis change is crucial to our success, and I look forward to discussing it with the team. Please be prepared to share your insights during the meeting.\n\nRegards,\nMichael",
            "tags": ["work"],
            "unread": True,
            "favorite": False,
            "folder": "inbox",
            "category": "updates"
        },
        {
            "name": "Aditya Jadhav",
            "email": "aditya@example.com",
            "subject": "Draft: Spacing issues on dashboard",
            "date": "1 day ago",
            "fullDate": "Yesterday, 6:00:00 PM",
            "snippet": "This is a draft containing notes on UI spacing issues that we need to fix before the presentation tomorrow...",
            "body": "This is a draft containing notes on UI spacing issues that we need to fix before the presentation tomorrow.\n\nMake sure Tailwind config is set up correctly and padding is consistent.",
            "tags": ["work"],
            "unread": False,
            "favorite": False,
            "folder": "drafts",
            "category": "updates"
        },
        {
            "name": "Ajit Thale",
            "email": "ajit@sky.net",
            "subject": "Sent: Re: Project Milestones",
            "date": "2 weeks ago",
            "fullDate": "Oct 5, 2023, 10:00:00 AM",
            "snippet": "I have successfully pushed the latest modifications. The system is functional and ready for testing. Please confirm receipt...",
            "body": "I have successfully pushed the latest modifications. The system is functional and ready for testing. Please confirm receipt.",
            "tags": ["work", "important"],
            "unread": False,
            "favorite": False,
            "folder": "sent",
            "category": "updates"
        },
        {
            "name": "Pratik Shimpi",
            "email": "pratik@example.com",
            "subject": "Claim your free account upgrade",
            "date": "3 weeks ago",
            "fullDate": "Sep 28, 2023, 11:00:00 AM",
            "snippet": "Congratulations! You have been selected to win a free account upgrade. Click this link immediately to claim...",
            "body": "Congratulations! You have been selected to win a free account upgrade. Click this link immediately to claim your reward.",
            "tags": ["personal"],
            "unread": False,
            "favorite": False,
            "folder": "trash",
            "category": "promotions"
        },
        {
            "name": "HR Department",
            "email": "hr@company.com",
            "subject": "Performance Review Q3",
            "date": "6 months ago",
            "fullDate": "Jun 1, 2023, 9:30:00 AM",
            "snippet": "Attached is the summary of your Q3 performance review. Thank you for your continued dedication and excellent contribution to the team...",
            "body": "Attached is the summary of your Q3 performance review. Thank you for your continued dedication and excellent contribution to the team this year.",
            "tags": ["work"],
            "unread": False,
            "favorite": False,
            "folder": "archive",
            "category": "updates"
        }
    ]


async def get_user_emails(user_id: str) -> List[Dict]:
    """Retrieves all emails for the user. Seeds initial emails if empty."""
    count = await _db()[COLLECTION_EMAILS].count_documents({"user_id": user_id})
    if count == 0:
        logger.info(f"Seeding mock emails for user {user_id}")
        seeds = get_seed_emails()
        for s in seeds:
            s["user_id"] = user_id
            s["created_at"] = datetime.now(timezone.utc)
        await _db()[COLLECTION_EMAILS].insert_many(seeds)

    docs = await _db()[COLLECTION_EMAILS].find({"user_id": user_id}).to_list(1000)
    return [clean_email(d) for d in docs]


async def create_email(user_id: str, email_data: Dict) -> Dict:
    """Creates a new email in MongoDB."""
    payload = {
        "user_id": user_id,
        "name": email_data.get("name", ""),
        "email": email_data.get("email", ""),
        "subject": email_data.get("subject", "(No Subject)"),
        "date": "Just now",
        "fullDate": datetime.now(timezone.utc).strftime("%b %d, %Y, %I:%M:%S %p"),
        "snippet": email_data.get("snippet", ""),
        "body": email_data.get("body", ""),
        "tags": email_data.get("tags", ["work"]),
        "unread": email_data.get("unread", False),
        "favorite": email_data.get("favorite", False),
        "folder": email_data.get("folder", "sent"),
        "category": email_data.get("category", "updates"),
        "created_at": datetime.now(timezone.utc)
    }
    result = await _db()[COLLECTION_EMAILS].insert_one(payload)
    return clean_email(payload)


async def update_email_db(user_id: str, email_id: str, updates: Dict) -> Optional[Dict]:
    """Updates an email's properties (folder, favorite, unread, etc.)."""
    allowed_keys = ["folder", "favorite", "unread", "category", "tags"]
    query = {
        "user_id": user_id
    }
    try:
        query["_id"] = ObjectId(email_id)
    except Exception:
        # Fallback if id is string-based from legacy/seeding
        query["id"] = email_id

    update_payload = {k: v for k, v in updates.items() if k in allowed_keys}
    if not update_payload:
        return None

    result = await _db()[COLLECTION_EMAILS].find_one_and_update(
        query,
        {"$set": update_payload},
        return_document=True
    )
    return clean_email(result)


async def delete_email_metadata(user_id: str, email_id: str) -> bool:
    """Deletes an email from MongoDB."""
    query = {
        "user_id": user_id
    }
    try:
        query["_id"] = ObjectId(email_id)
    except Exception:
        query["id"] = email_id

    result = await _db()[COLLECTION_EMAILS].delete_one(query)
    return result.deleted_count > 0
