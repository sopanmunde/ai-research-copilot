import logging
import sys
from src.core.config import settings


def get_logger(name: str) -> logging.Logger:
    """Returns a structured logger for the given module name."""
    logger = logging.getLogger(name)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        level = logging.DEBUG if settings.DEBUG else logging.INFO
        handler.setLevel(level)

        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(level)
        logger.propagate = False

    return logger


logger = get_logger("trivisionx_ai")
