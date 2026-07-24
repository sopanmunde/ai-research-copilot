"""File and input validators."""
from core.constants import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES
from core.exceptions import UploadException


def validate_file(filename: str, size_bytes: int) -> None:
    """
    Validate uploaded file extension and size.
    Raises UploadException on failure.
    """
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise UploadException(
            f"File type '{ext}' not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    if size_bytes > MAX_FILE_SIZE_BYTES:
        mb = size_bytes / (1024 * 1024)
        raise UploadException(
            f"File size {mb:.1f} MB exceeds the {MAX_FILE_SIZE_BYTES // (1024*1024)} MB limit"
        )
