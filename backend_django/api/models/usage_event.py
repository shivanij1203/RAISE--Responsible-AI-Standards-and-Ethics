from django.db import models
from django.utils import timezone


def _today():
    return timezone.localdate()


class UsageEvent(models.Model):
    """One anonymous count of something happening in RAISE.

    Stores only what kind of event it was, the kind of AI use (if any), the
    day, and whether a demo session did it. It never stores who did it: no
    user, email, IP address, sentence text, or other content, and no exact
    time. A test keeps it that way (test_usage_events.py).
    """

    DEMO_STARTED = 'demo_started'
    AI_USE_CREATED = 'ai_use_created'
    SCAN_RUN = 'scan_run'
    SUGGESTED_ANSWER_SAVED = 'suggested_answer_saved'
    DISCLOSURE_COPIED = 'disclosure_copied'
    RECORD_EXPORTED = 'record_exported'
    COURSE_STATEMENT_CREATED = 'course_statement_created'
    STATEMENT_COPIED = 'statement_copied'

    EVENT_CHOICES = [
        (DEMO_STARTED, 'Demo started'),
        (AI_USE_CREATED, 'AI use created'),
        (SCAN_RUN, 'Scan run'),
        (SUGGESTED_ANSWER_SAVED, 'Suggested answer saved'),
        (DISCLOSURE_COPIED, 'Disclosure copied'),
        (RECORD_EXPORTED, 'Record exported'),
        (COURSE_STATEMENT_CREATED, 'Course statement created'),
        (STATEMENT_COPIED, 'Statement copied'),
    ]

    event_type = models.CharField(max_length=40, choices=EVENT_CHOICES)
    # A use case key such as 'grading', or blank when the event has none.
    use_case = models.CharField(max_length=30, blank=True, default='')
    date = models.DateField(default=_today)
    is_demo = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=['date', 'event_type'])]

    def __str__(self) -> str:
        return f'{self.date} {self.event_type}'
