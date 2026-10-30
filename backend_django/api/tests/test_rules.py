"""The verified rule registry: every rule names its source, and last_checked
is set only for pages that were actually opened (docs/rule_sources/verification.json)."""
import json
import re
from pathlib import Path

import pytest

from api.rules import ALL_RULES, RULES_BY_ID
from api.rules.base import CHECKED_ON
from api.rules.usf import BOG_1001_NOTES, BOG_1001_STATUS
from api.services.journal_checklist import JOURNAL_ITEM_IDS, PUBLISHERS
from api.services.research_checklists import ALL_RESEARCH_ITEMS
from api.services.usf_notes import NOTES_BY_CHECKPOINT

VERIFICATION = json.loads(
    (Path(__file__).resolve().parents[3] / 'docs' / 'rule_sources' / 'verification.json').read_text()
)
OPENED_URLS = {page['url'] for page in VERIFICATION['opened']}
NOT_OPENED = VERIFICATION['not_opened']


@pytest.mark.parametrize('rule', ALL_RULES, ids=lambda r: r.rule_id)
def test_every_rule_names_its_source(rule) -> None:
    assert rule.source_name.strip()
    assert rule.source_url.startswith('https://')
    assert rule.source_version.strip()
    assert rule.quote.strip()
    assert rule.summary.strip()


@pytest.mark.parametrize('rule', ALL_RULES, ids=lambda r: r.rule_id)
def test_last_checked_is_set_only_for_pages_that_were_opened(rule) -> None:
    if rule.last_checked is not None:
        assert rule.source_url in OPENED_URLS
        assert rule.last_checked == VERIFICATION['checked_on'] == CHECKED_ON


def test_every_encoded_rule_was_checked() -> None:
    """Only rules whose page was opened are encoded, so none lacks a check date."""
    assert [r.rule_id for r in ALL_RULES if r.last_checked is None] == []


def test_verification_log_lists_each_encoded_rule_under_its_page() -> None:
    logged = {rule_id: page['url'] for page in VERIFICATION['opened'] for rule_id in page['rules']}

    assert logged == {r.rule_id: r.source_url for r in ALL_RULES}


def test_rules_from_pages_that_could_not_be_opened_are_not_encoded() -> None:
    for page in NOT_OPENED:
        assert all(r.source_url != page['url'] for r in ALL_RULES)
        assert not set(page['skipped_rules']) & set(RULES_BY_ID)


def test_rule_ids_are_unique() -> None:
    assert len(RULES_BY_ID) == len(ALL_RULES)


def _referenced_rule_ids() -> set[str]:
    ids = {rid for item in ALL_RESEARCH_ITEMS for rid in item.rules}
    for publisher in PUBLISHERS.values():
        ids |= {rid for item_id in JOURNAL_ITEM_IDS for rid in publisher.wording[item_id].rules}
        ids |= set(publisher.disclosure.rules)
        if publisher.disclosure.wording_rule:
            ids.add(publisher.disclosure.wording_rule)
    for notes in NOTES_BY_CHECKPOINT.values():
        ids |= {rid for note in notes for rid in note.rules}
    return ids


def test_items_and_notes_cite_only_registered_rules() -> None:
    assert _referenced_rule_ids() <= set(RULES_BY_ID)


def test_every_registered_rule_is_shown_somewhere() -> None:
    assert set(RULES_BY_ID) <= _referenced_rule_ids()


def test_no_usf_note_claims_a_tool_is_approved_for_a_data_level() -> None:
    for notes in NOTES_BY_CHECKPOINT.values():
        for note in notes:
            text = note.text.lower()
            assert 'approved for' not in text or 'no usf source that approves' in text
            for level in ('restricted data', 'sensitive data', 'public data'):
                assert level not in text


def test_bog_syllabus_rule_is_described_by_its_status() -> None:
    assert BOG_1001_STATUS in BOG_1001_NOTES
    if BOG_1001_STATUS == 'proposed':
        note = BOG_1001_NOTES['proposed'].lower()
        assert 'not yet a requirement' in note
        assert 'proposed' in note


def test_frontend_publisher_list_matches_the_backend() -> None:
    js = (Path(__file__).resolve().parents[3] / 'frontend' / 'src' / 'constants' / 'publishers.js').read_text()
    entries = re.findall(r"\{ key: '(\w+)', label: '([^']+)' \}", js)

    assert [(key, PUBLISHERS[key].label) for key, _ in entries] == entries
    assert [key for key, _ in entries] == list(PUBLISHERS)
