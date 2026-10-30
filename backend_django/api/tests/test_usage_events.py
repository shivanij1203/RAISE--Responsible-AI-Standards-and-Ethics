"""Anonymous usage counts: what is stored, where events are recorded, and the admin summary."""
import io
from datetime import date

from django.contrib.auth.models import User
from django.db import models
from django.test import Client, TestCase

from api.admin_usage import usage_summary
from api.models import UsageEvent, UserProfile
from api.services.usage import record_usage

ALLOWED_FIELDS = {'id', 'event_type', 'use_case', 'date', 'is_demo'}
PERSONAL_HINTS = ('user', 'email', 'ip', 'name', 'text', 'sentence', 'content', 'description', 'agent', 'session')


class UsageEventFieldsTest(TestCase):
    def test_table_has_only_the_anonymous_fields(self) -> None:
        names = {f.name for f in UsageEvent._meta.get_fields()}

        self.assertEqual(names, ALLOWED_FIELDS)

    def test_no_field_could_hold_personal_data(self) -> None:
        for field in UsageEvent._meta.get_fields():
            self.assertFalse(field.is_relation, f'{field.name} links to another table')
            self.assertFalse(any(hint in field.name for hint in PERSONAL_HINTS), field.name)
            self.assertNotIsInstance(field, (models.TextField, models.DateTimeField, models.GenericIPAddressField))
            if isinstance(field, models.CharField):
                self.assertLessEqual(field.max_length, 40, f'{field.name} is long enough to hold free text')

    def test_unknown_event_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            record_usage('something_else')

    def test_unknown_use_case_is_stored_blank(self) -> None:
        record_usage(UsageEvent.AI_USE_CREATED, use_case='I am grading essays for Jane Doe')

        self.assertEqual(UsageEvent.objects.get().use_case, '')


class UsageRecordingTest(TestCase):
    def setUp(self) -> None:
        self.client = Client()
        self.user = User.objects.create_user(username='f@usf.edu', email='f@usf.edu', password='pw12345678')
        UserProfile.objects.create(user=self.user, role='faculty')

    def _events(self) -> list[tuple[str, str, bool]]:
        return list(UsageEvent.objects.order_by('id').values_list('event_type', 'use_case', 'is_demo'))

    def test_demo_start_counts_a_demo_event(self) -> None:
        self.client.post('/api/auth/demo')

        self.assertIn((UsageEvent.DEMO_STARTED, '', True), self._events())

    def test_creating_an_ai_use_counts_its_use_case(self) -> None:
        self.client.login(username='f@usf.edu', password='pw12345678')
        self.client.post('/api/projects', data={'name': 'x', 'ai_use_case': 'grading'},
                         content_type='application/json')

        self.assertEqual(self._events(), [(UsageEvent.AI_USE_CREATED, 'grading', False)])

    def test_a_file_scan_counts_once(self) -> None:
        self.client.login(username='f@usf.edu', password='pw12345678')
        for scan_type, count in (('pii', '1'), ('ferpa', '0')):
            upload = io.BytesIO(b'student_id,score\n1,90\n')
            upload.name = 'scores.csv'
            self.client.post('/api/verify/scan-pii', data={'file': upload, 'scan_type': scan_type,
                                                          'use_case': 'grading', 'count_usage': count})

        self.assertEqual(self._events(), [(UsageEvent.SCAN_RUN, 'grading', False)])

    def test_browser_events_are_counted_through_the_endpoint(self) -> None:
        self.client.login(username='f@usf.edu', password='pw12345678')
        response = self.client.post('/api/usage', data={'event': 'disclosure_copied', 'use_case': 'teaching'},
                                    content_type='application/json')

        self.assertEqual(response.status_code, 204)
        self.assertEqual(self._events(), [(UsageEvent.DISCLOSURE_COPIED, 'teaching', False)])

    def test_endpoint_rejects_server_side_events(self) -> None:
        self.client.login(username='f@usf.edu', password='pw12345678')
        response = self.client.post('/api/usage', data={'event': 'demo_started'}, content_type='application/json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(self._events(), [])

    def test_endpoint_needs_a_signed_in_user(self) -> None:
        response = self.client.post('/api/usage', data={'event': 'record_exported'}, content_type='application/json')

        self.assertEqual(response.status_code, 401)


class UsageSummaryTest(TestCase):
    def test_daily_and_weekly_counts_split_demo_and_signed_in(self) -> None:
        today = date(2026, 10, 30)
        for is_demo in (False, False, True):
            UsageEvent.objects.create(event_type=UsageEvent.AI_USE_CREATED, use_case='grading',
                                      date=today, is_demo=is_demo)

        summary = usage_summary(today)

        self.assertEqual(summary['daily_rows'], [{
            'period': today, 'event': 'AI use created', 'use_case': 'Grading & Assessment',
            'signed_in': 2, 'demo': 1, 'total': 3,
        }])
        self.assertEqual(summary['weekly_rows'][0]['total'], 3)

    def test_admin_page_shows_the_summary(self) -> None:
        admin_user = User.objects.create_superuser('admin', 'admin@usf.edu', 'pw12345678')
        UsageEvent.objects.create(event_type=UsageEvent.SCAN_RUN, use_case='')
        client = Client()
        client.force_login(admin_user)

        response = client.get('/admin/api/usageevent/')

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Daily, last 14 days')
        self.assertContains(response, 'Scan run')
