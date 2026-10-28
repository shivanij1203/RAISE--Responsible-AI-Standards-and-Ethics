"""Write the landing page's example data from the real RAISE rules.

The home page shows what RAISE flags for each demo example and a sample of
the output for the Teaching example. Instead of hand-writing that text, this
command runs the same parser, checklist generator, scanners, and suggested
answers the app uses, and writes the result to
frontend/src/constants/landingExamples.json.

Run after changing the checklist, the parser, or the demo sentences:
    python manage.py export_landing_examples
A test (test_landing_examples.py) fails if the committed file is out of date.
"""
import json
from pathlib import Path

from django.core.management.base import BaseCommand

from api.serializers.project import infer_risk_context
from api.services.checkpoint_generator import generate_checkpoints_for_use_case
from api.services.pii_scanner import scan_csv_for_pii
from api.services.quick_add_parser import parse_activity_description
from api.services.smart_defaults import generate_smart_defaults
from api.views.verification import _describe_ferpa_findings

REPO = Path(__file__).resolve().parents[4]
OUTPUT = REPO / 'frontend' / 'src' / 'constants' / 'landingExamples.json'
SAMPLES = REPO / 'frontend' / 'public' / 'samples'

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


def teaching_output(sentence: str) -> dict:
    """A sample Teaching project after a scan and one confirmed suggested answer."""
    draft, items = checklist_for(sentence)
    sample = (SAMPLES / 'grading_sample.csv').read_text()
    scan = scan_csv_for_pii(sample)
    ferpa = [f for f in scan['findings'] if f['type'] in ('grade', 'enrollment', 'id_number')]
    risk = infer_risk_context({i['checkpoint_id'] for i in items})
    suggestions = generate_smart_defaults(
        use_case=draft['ai_use_case'], risk_context=risk, tools=['ChatGPT'],
        incomplete_checkpoints=[{'checkpoint_id': i['checkpoint_id'], 'label': i['label']} for i in items],
    )
    disclosure_answer = next(s for s in suggestions if s['checkpointId'] == 'ai_disclosure')

    decisions = [
        {'checkpoint': 'data_deidentified', 'description': f"Personal identifier scan: {scan['verdict']}",
         'proofType': 'automated_scan', 'proofValue': 'Personal identifier scan'},
        {'checkpoint': 'ferpa_compliance', 'description': f"Student record field scan: {_describe_ferpa_findings(ferpa)}",
         'proofType': 'automated_scan', 'proofValue': 'Student record field scan'},
        {'checkpoint': 'ai_disclosure', 'description': disclosure_answer['suggestedDescription'],
         'proofType': 'smart_default', 'proofValue': 'reviewed'},
    ]
    addressed = {d['checkpoint'] for d in decisions}
    return {
        'name': 'First-pass essay grading with ChatGPT',
        'description': sentence,
        'aiUseCase': draft['ai_use_case'],
        'aiTools': [{'name': 'ChatGPT'}],
        'checkpoints': [
            {
                'id': i['checkpoint_id'], 'label': i['label'], 'category': i['category'],
                'frameworks': i['frameworks'], 'completed': i['checkpoint_id'] in addressed,
            }
            for i in items
        ],
        'decisions': decisions,
    }


def build() -> dict:
    return {
        'examples': [example_summary(key, sentence) for key, sentence in EXAMPLES],
        'teachingProject': teaching_output(EXAMPLES[0][1]),
    }


def render(data: dict) -> str:
    return json.dumps(data, indent=2, ensure_ascii=False) + '\n'


class Command(BaseCommand):
    help = 'Write frontend/src/constants/landingExamples.json from the real RAISE rules.'

    def handle(self, *args, **options) -> None:
        OUTPUT.write_text(render(build()))
        self.stdout.write(self.style.SUCCESS(f'Wrote {OUTPUT}'))
