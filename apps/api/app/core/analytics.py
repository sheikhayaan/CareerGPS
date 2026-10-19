from typing import Optional, Dict, Any
import logging
from app.core.config import settings

logger = logging.getLogger("careergps.analytics")

# Initialize posthog client if API key is configured
posthog_client = None
if settings.POSTHOG_API_KEY:
    try:
        import posthog
        posthog.api_key = settings.POSTHOG_API_KEY
        posthog.host = settings.POSTHOG_HOST
        posthog_client = posthog
        logger.info("PostHog client initialized successfully.")
    except Exception as e:
        logger.warning(f"Failed to initialize PostHog: {e}")


def capture_product_event(
    event_name: str,
    distinct_id: str,
    properties: Optional[Dict[str, Any]] = None
):
    """
    Captures a privacy-conscious product analytics event to PostHog.
    Redacts any sensitive passwords, credentials, or personally identifiable financial data.
    """
    clean_props = properties.copy() if properties else {}
    
    # Strictly scrub sensitive attributes
    for forbidden in ["password", "token", "secret", "auth_header", "raw_salary"]:
        clean_props.pop(forbidden, None)

    if posthog_client:
        try:
            posthog_client.capture(
                distinct_id=distinct_id,
                event=event_name,
                properties=clean_props
            )
        except Exception as e:
            logger.error(f"PostHog capture failure for {event_name}: {e}")
    else:
        logger.debug(f"[Local Analytics Log] Event: {event_name} | DistinctID: {distinct_id} | Props: {clean_props}")
