import sys
from loguru import logger


def setup_logging(app_env: str = "dev") -> None:
    logger.remove()

    level = "DEBUG" if app_env.lower() == "dev" else "INFO"

    logger.add(
        sys.stdout,
        level=level,
        backtrace=False,
        diagnose=False,
        enqueue=True,
    )

    # Optional: log file (nice for “industrial” feel)
    logger.add(
        "logs/app.log",
        rotation="10 MB",
        retention="7 days",
        level=level,
        enqueue=True,
    )
