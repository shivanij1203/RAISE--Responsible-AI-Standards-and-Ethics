"""The short answer: headline cases, the reasons behind it, and the action cards."""
import itertools

import pytest
from django.contrib.auth.models import User
from django.test import Client, TestCase

from api.models import Decision, UserProfile
from api.services.checkpoint_generator import HIGH_PRIORITY_IDS, generate_checkpoints_for_use_case, rule_context_for
from api.services.short_answer import CHANGE, CHECK_WITH, FINE, NOTE, short_answer

FORBIDDEN = ('compliant', 'approved', 'safe')

# One sentence per kind of use, with the risk flags Quick Add would set.
USES = {
    'grading': ("I'm using ChatGPT to give first-pass grades and feedback on student essays.",
                {'involves_student_data': True, 'data_leaves_institution': True, 'affects_decisions': True}),
    'qualitative': ("I'm using ChatGPT to help code de-identified student interview transcripts for a research study.",
                    {'involves_student_data': True, 'data_leaves_institution': True}),
    'grant_proposal': ('using ChatGPT to help write my NIH R01', {'data_leaves_institution': True}),
    'peer_review': ('reviewing a manuscript with Claude', {'data_leaves_institution': True}),
    'journal_manuscript': ('editing my paper with ChatGPT before submitting to an Elsevier journal',
                           {'data_leaves_institution': True}),
}


def _items(use_case: str, description: str, risk: dict) -> list[dict]:
    generated = generate_checkpoints_for_use_case(use_case, risk, rule_context_for(description, None))
    return [{'id': c['checkpoint_id'], 'completed': False, 'highPriority': c['checkpoint_id'] in HIGH_PRIORITY_IDS}
            for c in generated]


def _complete(items: list[dict], which) -> list[dict]:
    return [{**i, 'completed': i['completed'] or which(i)} for i in items]


def _answer(items: list[dict], description: str = '') -> dict:
    return short_answer(items, description=description)


@pytest.mark.parametrize('use_case', USES)
def test_open_high_priority_items_ask_for_changes(use_case: str) -> None:
    description, risk = USES[use_case]
    # IRB items are approvals, so take them out of the way for this case.
    items = _complete(_items(use_case, description, risk), lambda i: i['id'] in ('irb', 'participant_consent'))
    open_high = sum(1 for i in items if i['highPriority'] and not i['completed'])

    answer = _answer(items, description)

    assert open_high > 0
    assert answer['kind'] == CHANGE
    assert answer['headline'] == f"Change {open_high} thing{'' if open_high == 1 else 's'} first"


@pytest.mark.parametrize('use_case', USES)
def test_no_open_high_priority_items_looks_fine(use_case: str) -> None:
    description, risk = USES[use_case]
    items = _complete(_items(use_case, description, risk), lambda i: i['highPriority'])

    answer = _answer(items, description)

    assert answer['kind'] == FINE
    assert answer['headline'] == 'Looks fine as described'


@pytest.mark.parametrize('use_case', USES)
def test_human_subjects_need_the_irb_first(use_case: str) -> None:
    description, risk = USES[use_case]
    items = _items(use_case, description, {**risk, 'involves_human_subjects': True})

    answer = _answer(items, description)

    assert answer['kind'] == CHECK_WITH
    assert answer['headline'] == 'Check with the IRB first'
    assert answer['reasons'][0]['source']['name'] == 'Common Rule'


def test_research_use_starts_with_the_irb_then_changes_then_fine() -> None:
    description, risk = USES['qualitative']
    items = _items('qualitative', description, risk)

    assert _answer(items)['headline'] == 'Check with the IRB first'
    items = _complete(items, lambda i: i['id'] in ('irb', 'participant_consent'))
    assert _answer(items)['kind'] == CHANGE
    items = _complete(items, lambda i: i['highPriority'])
    assert _answer(items)['headline'] == 'Looks fine as described'


def test_grant_with_controlled_access_data_checks_with_nih() -> None:
    description = 'drafting my NIH R01 with ChatGPT using dbGaP genomic data'
    items = _items('grant_proposal', description, {})

    answer = _answer(items, description)

    assert answer['headline'] == 'Check with NIH first'
    assert answer['reasons'][0]['source']['name'] == 'NIH NOT-OD-25-081'


def test_a_grant_without_controlled_data_words_does_not_check_with_nih() -> None:
    description, risk = USES['grant_proposal']

    assert _answer(_items('grant_proposal', description, risk), description)['kind'] == CHANGE


def test_looks_fine_only_when_no_high_priority_item_is_open() -> None:
    items = [{'id': 'data_deidentified', 'completed': False, 'highPriority': True},
             {'id': 'ai_disclosure', 'completed': False, 'highPriority': False}]

    assert _answer(items)['kind'] == CHANGE
    assert _answer(_complete(items, lambda i: i['highPriority']))['kind'] == FINE


@pytest.mark.parametrize('use_case', USES)
def test_reasons_are_short_and_cite_a_source(use_case: str) -> None:
    description, risk = USES[use_case]
    answer = _answer(_items(use_case, description, risk), description)

    assert 2 <= len(answer['reasons']) <= 3
    for reason in answer['reasons']:
        assert reason['source']['name']
        assert reason['text'].endswith('.') and reason['text'].count('. ') == 0
        assert '—' not in reason['text'] and '–' not in reason['text']
    assert answer['note'] == NOTE


def test_forbidden_words_never_appear_in_the_headline() -> None:
    for use_case, (description, risk) in USES.items():
        for flags in itertools.product([False, True], repeat=2):
            extra = dict(zip(('involves_human_subjects', 'affects_decisions'), flags))
            items = _items(use_case, description, {**risk, **extra})
            for state in (items, _complete(items, lambda i: i['highPriority']), _complete(items, lambda i: True)):
                headline = _answer(state, description)['headline'].lower()
                assert not any(word in headline for word in FORBIDDEN), headline


class ActionCardApiTest(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(username='p@usf.edu', email='p@usf.edu', password='pw12345678')
        UserProfile.objects.create(user=self.user, role='faculty')
        self.client = Client()
        self.client.login(username='p@usf.edu', password='pw12345678')

    def _create(self, use_case: str) -> dict:
        description, risk = USES[use_case]
        return self.client.post('/api/projects', data={
            'name': use_case, 'ai_use_case': use_case, 'description': description, 'risk_context': risk,
        }, content_type='application/json').json()

    def _act(self, project: dict, key: str, **body) -> dict:
        response = self.client.post(f"/api/projects/{project['id']}/actions/{key}", data=body,
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200, response.content)
        return response.json()

    @staticmethod
    def _done(project: dict) -> set[str]:
        return {c['id'] for c in project['checkpoints'] if c['completed']}

    @staticmethod
    def _card(project: dict, key: str) -> dict:
        return next(a for a in project['shortAnswer']['actions'] if a['key'] == key)

    def test_grading_cards_are_chosen_for_the_use_and_capped_at_four(self) -> None:
        project = self._create('grading')

        keys = [a['key'] for a in project['shortAnswer']['actions']]

        self.assertEqual(keys, ['remove_ids', 'university_tool', 'keep_judgment', 'tell_students'])
        self.assertEqual(self._card(project, 'remove_ids')['kind'], 'anonymize')

    def test_grading_cards_walk_the_headline_to_looks_fine(self) -> None:
        project = self._create('grading')
        self.assertEqual(project['shortAnswer']['headline'], 'Change 3 things first')

        project = self._act(project, 'university_tool')
        self.assertIn('ferpa_compliance', self._done(project))
        self.assertEqual(project['shortAnswer']['headline'], 'Change 2 things first')
        self.assertTrue(self._card(project, 'university_tool')['done'])

        project = self._act(project, 'remove_ids', documents=3)
        self.assertIn('data_deidentified', self._done(project))
        self.assertTrue(Decision.objects.filter(
            description='Removed student names and IDs from 3 documents with the RAISE anonymizer before any AI use.',
        ).exists())
        self.assertEqual(project['shortAnswer']['headline'], 'Change 1 thing first')

        # "Keep your judgment in it" saves through the suggested answer flow.
        self.client.post(f"/api/projects/{project['id']}/decisions", data={
            'checkpoint': 'grading_fairness', 'description': 'I compare AI grades across sections each week.',
        }, content_type='application/json')
        project = self.client.get(f"/api/projects/{project['id']}").json()
        self.assertEqual(project['shortAnswer']['headline'], 'Looks fine as described')

    def test_suggested_answer_cards_are_not_finished_by_the_action_endpoint(self) -> None:
        project = self._create('grading')
        response = self.client.post(f"/api/projects/{project['id']}/actions/keep_judgment",
                                    content_type='application/json')

        self.assertEqual(response.status_code, 400)

    def test_tell_your_students_is_finished_by_creating_the_course_statement(self) -> None:
        project = self._create('grading')
        self.client.post('/api/course-statements', data={
            'course_name': 'PSY 3213', 'term': 'Spring 2027', 'project_ids': [project['id']],
            'policy': 'acceptable', 'from_project_id': project['id'],
        }, content_type='application/json')

        project = self.client.get(f"/api/projects/{project['id']}").json()

        self.assertIn('grading_transparency', self._done(project))
        self.assertTrue(self._card(project, 'tell_students')['done'])

    def test_peer_review_upload_card_marks_the_upload_item(self) -> None:
        project = self._create('peer_review')
        self.assertTrue(self._card(project, 'review_no_upload')['highPriority'])

        project = self._act(project, 'review_no_upload')

        self.assertIn('review_journal_no_upload', self._done(project))
        self.assertNotIn('review_journal_disclose', self._done(project))

    def test_grant_cards_mark_originality_and_controlled_data(self) -> None:
        project = self._create('grant_proposal')
        self.assertEqual([a['key'] for a in project['shortAnswer']['actions']][:2],
                         ['grant_proposal', 'grant_controlled'])

        project = self._act(project, 'grant_proposal')
        project = self._act(project, 'grant_controlled')

        self.assertTrue({'grant_nih_originality', 'grant_nih_controlled_data'} <= self._done(project))

    def test_journal_disclosure_card_follows_the_publisher(self) -> None:
        project = self._create('journal_manuscript')
        card = self._card(project, 'get_disclosure')
        self.assertIn('Elsevier', card['text'])

        project = self._act(project, 'get_disclosure')

        self.assertIn('journal_ai_disclosure', self._done(project))

    def test_unknown_or_missing_card_is_rejected(self) -> None:
        project = self._create('journal_manuscript')
        response = self.client.post(f"/api/projects/{project['id']}/actions/review_no_upload",
                                    content_type='application/json')

        self.assertEqual(response.status_code, 400)

    def test_another_user_cannot_finish_a_card(self) -> None:
        project = self._create('grading')
        other = User.objects.create_user(username='o@usf.edu', email='o@usf.edu', password='pw12345678')
        UserProfile.objects.create(user=other, role='faculty')
        client = Client()
        client.login(username='o@usf.edu', password='pw12345678')

        response = client.post(f"/api/projects/{project['id']}/actions/university_tool",
                               content_type='application/json')

        self.assertEqual(response.status_code, 404)
