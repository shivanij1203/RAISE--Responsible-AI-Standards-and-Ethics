"""Write the landing page's example data from the real RAISE rules.

The home page shows what RAISE flags for each demo example and the checklist
for each one. Instead of hand-writing that text, this command runs the same
parser and checklist generator the app uses, and writes the result to
frontend/src/constants/landingExamples.json.

Run after changing the checklist, the parser, or the demo sentences:
    python manage.py export_landing_examples
A test (test_landing_examples.py) fails if the committed file is out of date.
"""
import json
from pathlib import Path

from django.core.management.base import BaseCommand

from api.services.checkpoint_generator import generate_checkpoints_for_use_case
from api.services.quick_add_parser import parse_activity_description
from api.views.preview import preview_for

REPO = Path(__file__).resolve().parents[4]
OUTPUT = REPO / 'frontend' / 'src' / 'constants' / 'landingExamples.json'

# Same sentences as frontend/src/constants/demoExamples.js (checked by the test).
EXAMPLES = [
    ('teaching', "I'm using ChatGPT to give first-pass grades and feedback on student essays."),
    ('research', "I'm using ChatGPT to help code de-identified student interview transcripts for a research study."),
    ('administration', "I'm using an AI tool to help screen student applications for our MS program."),
]

# Same list as CRITICAL_CHECKPOINT_IDS in frontend/src/utils/risk.js.
HIGH_PRIORITY_IDS = {'irb', 'data_deidentified', 'participant_consent', 'ferpa_compliance', 'grading_fairness', 'decision_impact'}

# Registry tools the demo seed creates; enough for the parser to match ChatGPT.
TOOLS = [{'id': 1, 'name': 'ChatGPT'}, {'id': 2, 'name': 'Claude'}]

# "Supported AI uses" on the landing page. Each label goes through the real
# parser, so the use case (and the areas shown) come from the same rules.
SUPPORTED_USES = [
    'Qualitative Data Analysis', 'Literature Review', 'Writing and Editing', 'Statistical Analysis',
    'Grant Proposal Writing', 'Teaching Materials', 'Grading and Assessment', 'Administrative Tasks',
]

# Plain-language area for each checklist item, in the order areas are shown.
AREAS = [
    ('FERPA', {'ferpa_compliance'}),
    ('IRB', {'irb'}),
    ('Consent', {'participant_consent'}),
    ('Fairness', {'grading_fairness', 'bias_audit', 'admin_bias_audit'}),
    ('Decisions about people', {'decision_impact', 'appeal_process'}),
    ('Privacy', {'data_deidentified', 'data_classification', 'data_storage', 'data_minimization'}),
    ('Accuracy', {'content_accuracy'}),
    ('Accessibility', {'accessibility_check'}),
    ('Copyright', {'ip_review'}),
    ('Human review', {'human_review', 'human_override', 'grading_validation', 'material_review_cycle'}),
    ('Disclosure', {'ai_disclosure', 'ai_coding_disclosure', 'ai_writing_disclosure', 'teaching_disclosure',
                    'admin_disclosure', 'grading_transparency'}),
]
MAX_AREAS = 3


def areas_for(item_ids: set[str]) -> list[str]:
    return [name for name, ids in AREAS if ids & item_ids][:MAX_AREAS]


def checklist_for(sentence: str) -> tuple[dict, list[dict]]:
    draft = parse_activity_description(sentence, TOOLS)
    items = generate_checkpoints_for_use_case(draft['ai_use_case'], draft['risk_context'])
    return draft, items


def example_summary(key: str, sentence: str) -> dict:
    draft, items = checklist_for(sentence)
    return {
        'key': key,
        'useCase': draft['ai_use_case'],
        'itemCount': len(items),
        'highPriority': [
            {'id': i['checkpoint_id'], 'label': i['label']}
            for i in items if i['checkpoint_id'] in HIGH_PRIORITY_IDS
        ],
    }


def supported_use(label: str) -> dict:
    draft, items = checklist_for(f'I use AI for {label.lower()}.')
    return {'label': label, 'useCase': draft['ai_use_case'], 'areas': areas_for({i['checkpoint_id'] for i in items})}


def build() -> dict:
    return {
        'examples': [example_summary(key, sentence) for key, sentence in EXAMPLES],
        'examplePreviews': {key: preview_for(sentence, TOOLS) for key, sentence in EXAMPLES},
        'supportedUses': [supported_use(label) for label in SUPPORTED_USES],
    }


def render(data: dict) -> str:
    return json.dumps(data, indent=2, ensure_ascii=False) + '\n'


class Command(BaseCommand):
    help = 'Write frontend/src/constants/landingExamples.json from the real RAISE rules.'

    def handle(self, *args, **options) -> None:
        OUTPUT.write_text(render(build()))
        self.stdout.write(self.style.SUCCESS(f'Wrote {OUTPUT}'))
