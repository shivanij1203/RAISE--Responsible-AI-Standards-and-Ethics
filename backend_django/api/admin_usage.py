"""Django admin view of the anonymous usage counts: daily and weekly totals by
event and use case, with demo sessions and signed-in users counted apart."""
from datetime import timedelta

from django.contrib import admin
from django.db.models import Count, Q
from django.db.models.functions import TruncWeek
from django.utils import timezone

from api.models import UsageEvent
from api.services.quick_add_parser import USE_CASE_LABELS

DAYS_SHOWN = 14
WEEKS_SHOWN = 8

_EVENT_LABELS = dict(UsageEvent.EVENT_CHOICES)


def _rows(queryset, period_field: str) -> list[dict]:
    """Counts grouped by period, event, and use case, newest first."""
    grouped = (
        queryset.values(period_field, 'event_type', 'use_case')
        .annotate(
            signed_in=Count('id', filter=Q(is_demo=False)),
            demo=Count('id', filter=Q(is_demo=True)),
        )
        .order_by(f'-{period_field}', 'event_type', 'use_case')
    )
    return [
        {
            'period': row[period_field],
            'event': _EVENT_LABELS.get(row['event_type'], row['event_type']),
            'use_case': USE_CASE_LABELS.get(row['use_case'], row['use_case']) or 'None',
            'signed_in': row['signed_in'],
            'demo': row['demo'],
            'total': row['signed_in'] + row['demo'],
        }
        for row in grouped
    ]


def usage_summary(today=None) -> dict[str, list[dict]]:
    today = today or timezone.localdate()
    daily = UsageEvent.objects.filter(date__gt=today - timedelta(days=DAYS_SHOWN))
    weekly = UsageEvent.objects.filter(date__gt=today - timedelta(weeks=WEEKS_SHOWN)).annotate(
        week=TruncWeek('date'))
    return {'daily_rows': _rows(daily, 'date'), 'weekly_rows': _rows(weekly, 'week')}


@admin.register(UsageEvent)
class UsageEventAdmin(admin.ModelAdmin):
    """Read-only. The list page opens with the daily and weekly summary tables."""
    change_list_template = 'admin/api/usageevent/change_list.html'
    list_display = ('date', 'event_type', 'use_case', 'is_demo')
    list_filter = ('event_type', 'is_demo', 'date')

    def has_add_permission(self, request) -> bool:
        return False

    def has_change_permission(self, request, obj=None) -> bool:
        return False

    def changelist_view(self, request, extra_context=None):
        context = {
            **(extra_context or {}),
            **usage_summary(),
            'days_shown': DAYS_SHOWN,
            'weeks_shown': WEEKS_SHOWN,
        }
        return super().changelist_view(request, extra_context=context)
