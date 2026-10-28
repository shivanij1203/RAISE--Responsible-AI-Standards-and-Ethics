"""The landing page's example data must match what the real rules produce."""
import re

from django.test import SimpleTestCase

from api.management.commands import export_landing_examples as export

DEMO_EXAMPLES_JS = export.REPO / 'frontend' / 'src' / 'constants' / 'demoExamples.js'


class LandingExamplesTest(SimpleTestCase):
    def test_committed_file_matches_the_current_rules(self) -> None:
        committed = export.OUTPUT.read_text()
        fresh = export.render(export.build())

        self.assertEqual(
            committed, fresh,
            'frontend/src/constants/landingExamples.json is out of date. '
            'Run: python manage.py export_landing_examples',
        )

    def test_sentences_match_the_demo_examples(self) -> None:
        js = DEMO_EXAMPLES_JS.read_text()
        sentences = re.findall(r'sentence: "([^"]+)"', js)

        self.assertEqual(sentences, [sentence for _, sentence in export.EXAMPLES])

    def test_supported_uses_map_to_the_expected_use_cases(self) -> None:
        expected = {
            'Qualitative Data Analysis': 'qualitative', 'Literature Review': 'literature',
            'Writing and Editing': 'writing', 'Statistical Analysis': 'data_analysis',
            'Grant Proposal Writing': 'writing', 'Teaching Materials': 'teaching',
            'Grading and Assessment': 'grading', 'Administrative Tasks': 'admin',
        }

        uses = {u['label']: u for u in export.build()['supportedUses']}

        self.assertEqual({label: u['useCase'] for label, u in uses.items()}, expected)
        self.assertTrue(all(1 <= len(u['areas']) <= export.MAX_AREAS for u in uses.values()))
