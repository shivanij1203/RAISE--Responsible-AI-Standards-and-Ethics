"""Public checklist preview: output, validation, throttling, and no writes."""
from django.apps import apps
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from api.models import AITool

URL = '/api/preview'


def row_counts() -> dict[str, int]:
    return {m._meta.label: m.objects.count() for m in apps.get_models()}


class PreviewTest(TestCase):
    def setUp(self) -> None:
        cache.clear()
        self.client = APIClient()
        AITool.objects.create(name='Claude')

    def test_returns_the_checklist_for_a_sentence(self) -> None:
        res = self.client.post(URL, {'description': 'I use Claude to summarize interview transcripts for my study'}, format='json')

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['useCase'], 'qualitative')
        self.assertEqual(res.data['tools'], ['Claude'])
        self.assertIn('Human subjects', [f['label'] for f in res.data['riskFlags']])
        irb = next(i for i in res.data['items'] if i['id'] == 'irb')
        self.assertEqual(irb['label'], 'Confirm your IRB protocol covers AI use')
        self.assertIn('IRB', irb['tags'])
        self.assertTrue(irb['highPriority'])
        self.assertIn('IRB', irb['what'])
        self.assertTrue(irb['why'] and irb['how'])
        common_rule = next(s for s in irb['sources'] if s['name'] == 'Common Rule')
        self.assertTrue(common_rule['url'].startswith('https://www.hhs.gov/'))

    def test_stores_nothing(self) -> None:
        before = row_counts()

        res = self.client.post(URL, {'description': "I'm using ChatGPT to grade student essays."}, format='json')

        self.assertEqual(res.status_code, 200)
        self.assertEqual(row_counts(), before)

    def test_rejects_empty_input(self) -> None:
        for body in ({}, {'description': ''}, {'description': '   '}, {'description': 12}):
            with self.subTest(body=body):
                res = self.client.post(URL, body, format='json')
                self.assertEqual(res.status_code, 400)

    def test_rejects_overlong_input(self) -> None:
        self.assertEqual(self.client.post(URL, {'description': 'a' * 300}, format='json').status_code, 200)
        self.assertEqual(self.client.post(URL, {'description': 'a' * 301}, format='json').status_code, 400)

    def test_ignores_a_bad_token(self) -> None:
        self.client.credentials(HTTP_AUTHORIZATION='Token not-a-real-token')

        res = self.client.post(URL, {'description': 'I use AI to draft emails.'}, format='json')

        self.assertEqual(res.status_code, 200)

    def test_throttled_after_thirty_per_hour(self) -> None:
        body = {'description': 'I use AI to draft emails.'}
        for _ in range(30):
            self.assertEqual(self.client.post(URL, body, format='json').status_code, 200)

        self.assertEqual(self.client.post(URL, body, format='json').status_code, 429)

    def test_throttle_keys_on_the_ip_render_appends(self) -> None:
        body = {'description': 'I use AI to draft emails.'}
        for i in range(30):
            # A spoofed first entry must not give the client a fresh bucket.
            res = self.client.post(URL, body, format='json', HTTP_X_FORWARDED_FOR=f'10.0.0.{i}, 203.0.113.7')
            self.assertEqual(res.status_code, 200)

        res = self.client.post(URL, body, format='json', HTTP_X_FORWARDED_FOR='10.9.9.9, 203.0.113.7')
        self.assertEqual(res.status_code, 429)
        other = self.client.post(URL, body, format='json', HTTP_X_FORWARDED_FOR='10.9.9.9, 198.51.100.4')
        self.assertEqual(other.status_code, 200)
