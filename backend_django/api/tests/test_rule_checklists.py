"""Grant proposal, peer review, and journal manuscript checklists, and the "At USF" notes."""
from django.contrib.auth.models import User
from django.test import Client, TestCase

from api.models import Project, UserProfile
from api.services.checkpoint_generator import generate_checkpoints_for_use_case
from api.services.journal_checklist import JOURNAL_ITEM_IDS

NIH_ORIGINALITY_URL = 'https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-132.html'
ELSEVIER_URL = 'https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals'
IEEE_URL = 'https://open.ieee.org/author-guidelines-for-artificial-intelligence-ai-generated-text/'


def _ids(use_case: str, rule_context: dict) -> list[str]:
    return [cp['checkpoint_id'] for cp in generate_checkpoints_for_use_case(use_case, {}, rule_context)]


class GeneratorTest(TestCase):
    def test_nih_grant_gets_only_nih_items(self) -> None:
        ids = _ids('grant_proposal', {'funders': ['nih']})

        self.assertEqual(ids, [
            'grant_nih_originality', 'grant_nih_post_award',
            'grant_nih_controlled_data', 'grant_nih_application_limit',
        ])

    def test_grant_without_a_named_funder_gets_nih_and_nsf_items(self) -> None:
        ids = _ids('grant_proposal', {'funders': []})

        self.assertIn('grant_nih_originality', ids)
        self.assertIn('grant_nsf_disclosure', ids)

    def test_grant_skips_the_generic_irb_and_disclosure_items(self) -> None:
        ids = _ids('grant_proposal', {'funders': []})

        self.assertNotIn('irb', ids)
        self.assertNotIn('ai_disclosure', ids)

    def test_manuscript_review_gets_journal_items_only(self) -> None:
        ids = _ids('peer_review', {'funders': [], 'review_of': 'manuscript'})

        self.assertEqual(ids, ['review_journal_no_upload', 'review_journal_disclose'])

    def test_unclear_review_gets_funder_and_journal_items(self) -> None:
        ids = _ids('peer_review', {'funders': [], 'review_of': None})

        self.assertEqual(set(ids), {
            'review_nih_no_ai', 'review_nsf_no_upload', 'review_journal_no_upload', 'review_journal_disclose',
        })

    def test_journal_manuscript_has_the_four_publisher_items(self) -> None:
        self.assertEqual(_ids('journal_manuscript', {'publisher': 'elsevier'}), list(JOURNAL_ITEM_IDS))

    def test_journal_items_are_worded_for_the_publisher(self) -> None:
        elsevier = generate_checkpoints_for_use_case('journal_manuscript', {}, {'publisher': 'elsevier'})
        ieee = generate_checkpoints_for_use_case('journal_manuscript', {}, {'publisher': 'ieee'})

        self.assertEqual(elsevier[1]['label'], 'Add a separate AI declaration statement')
        self.assertEqual(ieee[1]['label'], 'Disclose AI use in the acknowledgments')
        self.assertEqual(elsevier[1]['frameworks'], ['Elsevier'])


class RuleChecklistApiTest(TestCase):
    def setUp(self) -> None:
        self.client = Client()
        self.user = User.objects.create_user(username='r@usf.edu', email='r@usf.edu', password='pw12345678')
        UserProfile.objects.create(user=self.user, role='faculty')
        self.client.login(username='r@usf.edu', password='pw12345678')

    def _create(self, description: str, use_case: str, **extra) -> dict:
        response = self.client.post(
            '/api/projects',
            data={'name': 'Test', 'description': description, 'ai_use_case': use_case, **extra},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201, response.content)
        return response.json()

    @staticmethod
    def _item(project: dict, checkpoint_id: str) -> dict:
        return next(c for c in project['checkpoints'] if c['id'] == checkpoint_id)

    def test_nih_r01_checklist_cites_the_nih_notice(self) -> None:
        project = self._create('using ChatGPT to help write my NIH R01', 'grant_proposal')
        item = self._item(project, 'grant_nih_originality')

        self.assertEqual([s['url'] for s in item['sources']], [NIH_ORIGINALITY_URL])
        self.assertEqual(item['sources'][0]['version'], 'Released July 17, 2025')
        self.assertEqual(item['sources'][0]['lastChecked'], '2026-10-30')
        self.assertIn('substantially developed by AI', item['quotes'][0]['quote'])
        self.assertNotIn('grant_nsf_disclosure', [c['id'] for c in project['checkpoints']])

    def test_application_limit_is_an_information_note(self) -> None:
        project = self._create('using ChatGPT to help write my NIH R01', 'grant_proposal')

        self.assertEqual(self._item(project, 'grant_nih_application_limit')['kind'], 'info')
        self.assertEqual(self._item(project, 'grant_nih_originality')['kind'], 'check')

    def test_peer_review_items_are_high_priority(self) -> None:
        project = self._create('reviewing a manuscript with Claude', 'peer_review')
        review_items = [c for c in project['checkpoints'] if c['id'].startswith('review_')]

        self.assertEqual(len(review_items), 2)
        self.assertTrue(all(c['highPriority'] for c in review_items))

    def test_publisher_named_in_the_sentence_is_stored(self) -> None:
        project = self._create(
            'editing my paper with AI before submitting to an Elsevier journal', 'journal_manuscript')

        self.assertEqual(project['publisher'], 'elsevier')
        self.assertEqual(project['disclosureGuide']['location'], 'a separate AI declaration statement in the manuscript')
        self.assertTrue(project['disclosureGuide']['publisherWording'])
        self.assertIn('During the preparation of this work', project['disclosureGuide']['draft'])

    def test_switching_publisher_rewords_the_items_and_keeps_their_status(self) -> None:
        project = self._create('editing my paper with AI before submitting to an Elsevier journal',
                               'journal_manuscript')
        self.client.put(f"/api/projects/{project['id']}/checkpoints/journal_ai_authorship")

        response = self.client.put(
            f"/api/projects/{project['id']}", data={'publisher': 'ieee'}, content_type='application/json')
        updated = response.json()
        disclosure = self._item(updated, 'journal_ai_disclosure')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(updated['publisher'], 'ieee')
        self.assertEqual(disclosure['label'], 'Disclose AI use in the acknowledgments')
        self.assertEqual({s['url'] for s in disclosure['sources']}, {IEEE_URL})
        self.assertEqual(updated['disclosureGuide']['location'], 'the acknowledgments section')
        self.assertTrue(self._item(updated, 'journal_ai_authorship')['completed'])
        self.assertEqual(len(updated['checkpoints']), 4)

    def test_unverified_publisher_says_it_has_no_verified_rule(self) -> None:
        project = self._create('writing my manuscript for a journal', 'journal_manuscript', publisher='apa')
        item = self._item(project, 'journal_ai_disclosure')

        self.assertIn('no verified APA rule', item['what'])
        self.assertEqual(item['sources'], [])

    def test_unknown_publisher_is_rejected(self) -> None:
        project = self._create('writing my manuscript for a journal', 'journal_manuscript')
        response = self.client.put(
            f"/api/projects/{project['id']}", data={'publisher': 'made_up'}, content_type='application/json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Project.objects.get(id=project['id']).publisher, '')

    def test_other_use_cases_have_no_publisher_or_guide(self) -> None:
        project = self._create('Using ChatGPT to grade essays.', 'grading')

        self.assertIsNone(project['publisher'])
        self.assertIsNone(project['disclosureGuide'])


class UsfNotesApiTest(TestCase):
    def setUp(self) -> None:
        self.client = Client()
        self.user = User.objects.create_user(username='u@usf.edu', email='u@usf.edu', password='pw12345678')
        UserProfile.objects.create(user=self.user, role='faculty')
        self.client.login(username='u@usf.edu', password='pw12345678')

    def _checkpoints(self, use_case: str, risk_context: dict) -> dict[str, dict]:
        response = self.client.post('/api/projects', data={
            'name': 'Test', 'description': 'x', 'ai_use_case': use_case, 'risk_context': risk_context,
        }, content_type='application/json')
        return {c['id']: c for c in response.json()['checkpoints']}

    def test_data_items_note_copilot_and_public_tools(self) -> None:
        notes = self._checkpoints('grading', {'involves_student_data': True})['ferpa_compliance']['usfNotes']
        keys = [n['key'] for n in notes]

        self.assertEqual(keys, ['public_tools', 'copilot'])
        copilot = notes[1]
        self.assertIn('funding terms require data to stay in the United States', copilot['text'])
        self.assertTrue(all(s['url'] and s['name'] for s in copilot['sources']))

    def test_syllabus_items_note_the_provost_samples_and_the_pending_bog_rule(self) -> None:
        notes = self._checkpoints('grading', {})['grading_transparency']['usfNotes']
        by_key = {n['key']: n for n in notes}

        self.assertIn('Acceptable Use and Restricted Use', by_key['syllabus']['text'])
        self.assertIn('not yet a requirement', by_key['bog_1001']['text'])

    def test_writing_disclosure_notes_the_thesis_rule(self) -> None:
        notes = self._checkpoints('writing', {})['ai_writing_disclosure']['usfNotes']

        self.assertEqual([n['key'] for n in notes], ['thesis'])
        self.assertIn('entire committee', notes[0]['text'])

    def test_items_without_a_usf_rule_have_no_notes(self) -> None:
        self.assertEqual(self._checkpoints('grading', {})['grading_validation']['usfNotes'], [])
