"""Record anonymous usage counts (see api.models.UsageEvent).

Counting must never break the action being counted, so a failed write is
logged and dropped.
"""
import logging

from django.contrib.auth.models import User
from django.db import DatabaseError, transaction

from api.models import UsageEvent
from api.services.demo_accounts import is_demo_user
from api.services.quick_add_parser import USE_CASE_LABELS

logger = logging.getLogger(__name__)

EVENT_TYPES = frozenset(value for value, _label in UsageEvent.EVENT_CHOICES)

# Events that happen only in the browser (copying text, exporting a PDF), so
# the app reports them through POST /api/usage. All others are recorded by
# the server where they happen.
CLIENT_EVENTS = frozenset({
    UsageEvent.DISCLOSURE_COPIED,
    UsageEvent.RECORD_EXPORTED,
    UsageEvent.STATEMENT_COPIED,
})


def clean_use_case(use_case: object) -> str:
    """A known use case key, or '' for anything else."""
    return use_case if isinstance(use_case, str) and use_case in USE_CASE_LABELS else ''


def record_usage(event_type: str, *, user: User | None = None, use_case: object = '') -> None:
    """Count one event. Only the event type, use case, day, and demo flag are stored."""
    if event_type not in EVENT_TYPES:
        raise ValueError(f'Unknown usage event: {event_type}')
    try:
        # A savepoint, so a failure here cannot spoil the caller's transaction.
        with transaction.atomic():
            UsageEvent.objects.create(
                event_type=event_type,
                use_case=clean_use_case(use_case),
                is_demo=is_demo_user(user),
            )
    except DatabaseError:
        logger.exception('Could not record usage event %s', event_type)
