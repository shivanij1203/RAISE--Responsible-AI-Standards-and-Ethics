"""Checkpoint labels read as tasks, and existing rows are relabeled by checkpoint_id."""
import importlib

from django.apps import apps
from django.contrib.auth.models import User
from django.test import TestCase

from api.models import Checkpoint, Project
from api.services.checkpoint_generator import generate_checkpoints_for_use_case

USE_CASES = ['data_analysis', 'qualitative', 'ml_model', 'literature', 'writing',
             'grading', 'teaching', 'admin', 'other']
ALL_RISKS = {
    'involves_student_data': True, 'affects_decisions': True,
    'external_service': True, 'human_subjects': True, 'involves_human_subjects': True,
    'data_leaves_institution': True,
}
VERDICT_WORDS = ('verified', 'confirmed', 'met', 'completed', 'conducted', 'validated',
                 'established', 'determined', 'compliance', 'defined', 'reviewed')

migration = importlib.import_module('api.migrations.0018_checkpoint_task_labels')


def _generated_labels() -> dict[str, str]:
    labels: dict[str, str] = {}
    for use_case in USE_CASES:
        for risks in ({}, ALL_RISKS):
            for cp in generate_checkpoints_for_use_case(use_case, risks):
                labels[cp['checkpoint_id']] = cp['label']
    return labels


class CheckpointLabelTest(TestCase):
    def test_generated_labels_are_tasks_not_verdicts(self) -> None:
        for checkpoint_id, label in _generated_labels().items():
            words = label.lower().split()
            for verdict in VERDICT_WORDS:
                self.assertNotIn(verdict, words, f'{checkpoint_id}: {label}')

    def test_migration_matches_the_generator(self) -> None:
        generated = _generated_labels()
        new_labels = {cid: labels[1] for cid, labels in migration._LABELS.items()}

        self.assertEqual(set(generated), set(new_labels))
        self.assertEqual(generated, new_labels)

    def test_migration_relabels_existing_rows_by_checkpoint_id(self) -> None:
        user = User.objects.create_user(username='p@usf.edu', email='p@usf.edu', password='x' * 12)
        project = Project.objects.create(user=user, name='Old activity', ai_use_case='grading')
        old = Checkpoint.objects.create(
            project=project, checkpoint_id='ferpa_compliance',
            label='FERPA Compliance Verified', category='Privacy', assigned_to='pi',
        )
        renamed_before = Checkpoint.objects.create(
            project=project, checkpoint_id='grading_fairness',
            label='Some older wording', category='Fairness', assigned_to='pi',
        )

        migration.use_task_labels(apps, None)

        old.refresh_from_db()
        renamed_before.refresh_from_db()
        self.assertEqual(old.label, 'Check whether FERPA applies to this data')
        self.assertEqual(old.checkpoint_id, 'ferpa_compliance')
        self.assertEqual(renamed_before.label, 'Check AI grades for fairness')

        migration.restore_verdict_labels(apps, None)
        old.refresh_from_db()
        self.assertEqual(old.label, 'FERPA Compliance Verified')


class CheckpointSourcesTest(TestCase):
    def test_only_vetted_sources_have_links(self) -> None:
        from api.services.checkpoint_generator import SOURCE_URLS, sources_for

        sources = {s['name']: s['url'] for s in sources_for(
            ['FERPA', 'Common Rule', 'NIST AI RMF', 'HIPAA', 'Institutional Policy', 'Journal Policy'],
        )}

        self.assertEqual(set(SOURCE_URLS), {'FERPA', 'Common Rule', 'NIST AI RMF', 'HIPAA'})
        self.assertEqual(sources['FERPA'], 'https://studentprivacy.ed.gov/ferpa')
        self.assertIsNone(sources['Institutional Policy'])
        self.assertIsNone(sources['Journal Policy'])

    def test_api_returns_sources_for_each_item(self) -> None:
        from django.test import Client
        user = User.objects.create_user(username='s@usf.edu', email='s@usf.edu', password='x' * 12)
        project = Project.objects.create(user=user, name='Grading', ai_use_case='grading')
        Checkpoint.objects.create(
            project=project, checkpoint_id='ferpa_compliance', label='Check whether FERPA applies',
            category='Privacy', assigned_to='pi', frameworks=['FERPA', 'Institutional Policy'],
        )
        client = Client()
        client.force_login(user)

        item = client.get(f'/api/projects/{project.id}').json()['checkpoints'][0]

        self.assertEqual(item['sources'], [
            {'name': 'FERPA', 'url': 'https://studentprivacy.ed.gov/ferpa'},
            {'name': 'Institutional Policy', 'url': None},
        ])
