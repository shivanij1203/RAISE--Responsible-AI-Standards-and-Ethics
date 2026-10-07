"""A suggested answer never marks an item addressed until it is edited or confirmed."""
from django.contrib.auth.models import User
from django.test import Client, TestCase

from api.models import Checkpoint, Decision, Project, UserProfile
from api.services.suggested_answers import SUGGESTION_REVIEW_REQUIRED


class SuggestedAnswerReviewTest(TestCase):
    def setUp(self) -> None:
        self.owner = User.objects.create_user(
            username='prof@usf.edu', email='prof@usf.edu', password='testpass123',
        )
        UserProfile.objects.create(user=self.owner, role='faculty')
        self.client = Client()
        self.client.login(username='prof@usf.edu', password='testpass123')

        self.project = Project.objects.create(
            user=self.owner, name='Writing help', ai_use_case='writing',
        )
        self.checkpoint = Checkpoint.objects.create(
            project=self.project, checkpoint_id='ai_writing_disclosure',
            label='Disclose AI writing assistance', category='Transparency', assigned_to='pi',
        )
        self.suggestion = self._suggestion_text()

    def _suggestion_text(self) -> str:
        body = self.client.get(f'/api/projects/{self.project.id}/smart-defaults').json()
        drafts = {d['checkpointId']: d for d in body['drafts']}
        return drafts['ai_writing_disclosure']['suggestedDescription']

    def _save(self, **data):
        payload = {'checkpoint': 'ai_writing_disclosure', **data}
        return self.client.post(
            f'/api/projects/{self.project.id}/decisions',
            data=payload, content_type='application/json',
        )

    def _assert_not_addressed(self, response) -> None:
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], SUGGESTION_REVIEW_REQUIRED)
        self.checkpoint.refresh_from_db()
        self.assertFalse(self.checkpoint.completed)
        self.assertFalse(Decision.objects.filter(checkpoint=self.checkpoint).exists())

    def test_unedited_suggestion_is_refused(self) -> None:
        response = self._save(description=self.suggestion, proofType='smart_default')

        self._assert_not_addressed(response)

    def test_unedited_suggestion_is_refused_without_the_proof_type(self) -> None:
        # The rule cannot be skipped by leaving out proofType.
        response = self._save(description=self.suggestion)

        self._assert_not_addressed(response)

    def test_whitespace_or_case_changes_do_not_count_as_edits(self) -> None:
        response = self._save(
            description=f'  {self.suggestion.upper()}  ', proofType='smart_default',
        )

        self._assert_not_addressed(response)

    def test_reviewed_flag_false_is_refused(self) -> None:
        response = self._save(
            description=self.suggestion, proofType='smart_default', reviewed=False,
        )

        self._assert_not_addressed(response)

    def test_confirmed_suggestion_is_saved(self) -> None:
        response = self._save(
            description=self.suggestion, proofType='smart_default', reviewed=True,
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json()['checkpointCompleted'])
        decision = Decision.objects.get(checkpoint=self.checkpoint)
        self.assertEqual(decision.proof_type, 'smart_default')
        self.assertEqual(decision.proof_value, 'reviewed')

    def test_edited_suggestion_is_saved(self) -> None:
        edited = self.suggestion + ' We used it for grammar only in chapter 2.'

        response = self._save(description=edited, proofType='smart_default')

        self.assertEqual(response.status_code, 201)
        decision = Decision.objects.get(checkpoint=self.checkpoint)
        self.assertEqual(decision.description, edited)
        self.assertEqual(decision.proof_value, 'edited')

    def test_a_manual_answer_is_unaffected(self) -> None:
        response = self._save(description='Added a disclosure note to the paper.')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Decision.objects.get(checkpoint=self.checkpoint).proof_value, '')
