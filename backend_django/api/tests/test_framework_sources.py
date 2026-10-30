"""Sources on the original checklist items: every item names a source, official
pages keep their vetted links, and only pages opened on the check date carry
a version and a last_checked date."""
import json
from pathlib import Path

import pytest

from api.rules.base import CHECKED_ON
from api.rules.frameworks import OFFICIAL_SOURCES, PLAIN_LABELS
from api.services.checkpoint_generator import FRAMEWORK_MAP, generate_checkpoints_for_use_case, sources_for

VERIFICATION = json.loads(
    (Path(__file__).resolve().parents[3] / 'docs' / 'rule_sources' / 'verification.json').read_text()
)['framework_pages']
OPENED = {page['tag']: page['url'] for page in VERIFICATION['opened']}

ORIGINAL_USE_CASES = ['data_analysis', 'qualitative', 'ml_model', 'writing', 'literature', 'grading', 'teaching', 'admin']
ALL_RISKS = {'involves_student_data': True, 'data_leaves_institution': True,
             'affects_decisions': True, 'involves_human_subjects': True}


def _original_items() -> list[dict]:
    items = {}
    for use_case in ORIGINAL_USE_CASES:
        for risk in ({}, ALL_RISKS):
            for item in generate_checkpoints_for_use_case(use_case, risk):
                items[item['checkpoint_id']] = item
    return list(items.values())


@pytest.mark.parametrize('item', _original_items(), ids=lambda i: i['checkpoint_id'])
def test_every_original_item_shows_a_source_name(item) -> None:
    sources = sources_for(item['frameworks'])

    assert sources, f"{item['checkpoint_id']} has no source"
    assert all(s['name'] for s in sources)


def test_every_tag_is_either_official_or_a_plain_label() -> None:
    tags = {tag for tags in FRAMEWORK_MAP.values() for tag in tags}

    assert tags <= set(OFFICIAL_SOURCES) | PLAIN_LABELS
    assert not set(OFFICIAL_SOURCES) & PLAIN_LABELS


def test_official_sources_keep_their_vetted_links() -> None:
    assert {tag: s.url for tag, s in OFFICIAL_SOURCES.items()} == {
        'FERPA': 'https://studentprivacy.ed.gov/ferpa',
        'Common Rule': 'https://www.hhs.gov/ohrp/regulations-and-policy/regulations/45-cfr-46/index.html',
        'NIST AI RMF': 'https://www.nist.gov/itl/ai-risk-management-framework',
        'HIPAA': 'https://www.hhs.gov/hipaa/index.html',
    }


def test_only_pages_opened_on_the_check_date_have_a_version_and_date() -> None:
    for tag, source in OFFICIAL_SOURCES.items():
        if tag in OPENED:
            assert source.last_checked == CHECKED_ON == VERIFICATION['checked_on']
            assert source.url == OPENED[tag]
            assert source.version
        else:
            assert source.last_checked is None
            assert source.version is None


def test_plain_labels_have_no_link_version_or_date() -> None:
    for source in sources_for(sorted(PLAIN_LABELS)):
        assert source == {'name': source['name'], 'url': None, 'version': None, 'lastChecked': None}
