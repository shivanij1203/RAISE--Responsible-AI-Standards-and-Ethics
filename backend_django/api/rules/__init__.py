"""Verified funder, journal, and USF rules. See base.py for the shapes."""
from api.rules.base import Rule, Source, citation
from api.rules.funders import FUNDER_RULES
from api.rules.journals import JOURNAL_RULES
from api.rules.usf import USF_RULES

ALL_RULES: tuple[Rule, ...] = FUNDER_RULES + JOURNAL_RULES + USF_RULES
RULES_BY_ID: dict[str, Rule] = {rule.rule_id: rule for rule in ALL_RULES}


def citations(rule_ids: list[str] | tuple[str, ...]) -> list[dict[str, str | None]]:
    """The rules behind an item, in order, as the API sends them."""
    return [citation(RULES_BY_ID[rid]) for rid in rule_ids if rid in RULES_BY_ID]


__all__ = ['ALL_RULES', 'RULES_BY_ID', 'Rule', 'Source', 'citation', 'citations']
