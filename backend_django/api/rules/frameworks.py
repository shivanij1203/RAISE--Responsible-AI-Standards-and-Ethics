"""Sources for the original checklist items' framework tags (FERPA, IRB, and so on).

Each tag is the source name shown on an item. Four tags have an official
page (their URLs were vetted when the checklist was written). A tag gets a
page version and a last_checked date only when its page was opened on that
date; see docs/rule_sources/verification.json. Every other tag is a plain
label with no link or date. Do not invent links or dates for them.
"""
from dataclasses import dataclass

from api.rules.base import CHECKED_ON


@dataclass(frozen=True)
class FrameworkSource:
    name: str
    url: str | None = None
    version: str | None = None
    last_checked: str | None = None

    def as_dict(self) -> dict[str, str | None]:
        return {'name': self.name, 'url': self.url, 'version': self.version, 'lastChecked': self.last_checked}


OFFICIAL_SOURCES: dict[str, FrameworkSource] = {
    # Opened on CHECKED_ON. The page shows no update date.
    'FERPA': FrameworkSource(
        'FERPA', 'https://studentprivacy.ed.gov/ferpa',
        version='34 CFR Part 99; no update date on page', last_checked=CHECKED_ON,
    ),
    # Opened on CHECKED_ON. The page dates the framework, not itself.
    'NIST AI RMF': FrameworkSource(
        'NIST AI RMF', 'https://www.nist.gov/itl/ai-risk-management-framework',
        version='AI RMF 1.0, released January 26, 2023', last_checked=CHECKED_ON,
    ),
    # hhs.gov returned 403 Access Denied on CHECKED_ON, so these two keep
    # their vetted links without a version or a check date.
    'Common Rule': FrameworkSource(
        'Common Rule', 'https://www.hhs.gov/ohrp/regulations-and-policy/regulations/45-cfr-46/index.html',
    ),
    'HIPAA': FrameworkSource('HIPAA', 'https://www.hhs.gov/hipaa/index.html'),
}

# Tags with no official page behind them. Shown as plain text.
PLAIN_LABELS: frozenset[str] = frozenset({
    'IRB', 'Institutional Policy', 'Transparency', 'Journal Policy', 'Fairness', 'Accountability',
    'Privacy', 'ADA', 'Section 508', 'Copyright', 'Civil Rights',
})


def framework_source(tag: str) -> FrameworkSource:
    return OFFICIAL_SOURCES.get(tag) or FrameworkSource(tag)
