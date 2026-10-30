"""Shapes for the verified rules RAISE shows on checklist items.

A Rule is one requirement from one published page, with the exact words the
page uses. Every rule names its source (name, URL, the date or version the
page shows) and the date someone last opened that page and confirmed the
quote. last_checked stays None for a page nobody opened.

Rules come only from docs/rule_sources/. Do not add a rule from memory.
"""
from dataclasses import dataclass

# The date the source pages were opened and every quote was compared with
# the live page. docs/rule_sources/verification.json lists those pages.
CHECKED_ON = '2026-10-30'


@dataclass(frozen=True)
class Source:
    name: str
    url: str
    # What the page itself shows: a release date, "Last updated ...", or a
    # note that it shows no date.
    version: str
    # ISO date the page was opened and the quotes on it were confirmed.
    last_checked: str | None = None


@dataclass(frozen=True)
class Rule:
    rule_id: str
    source: Source
    # Exact words from the page.
    quote: str
    # The requirement in plain words, for the checklist item.
    summary: str

    @property
    def source_name(self) -> str:
        return self.source.name

    @property
    def source_url(self) -> str:
        return self.source.url

    @property
    def source_version(self) -> str:
        return self.source.version

    @property
    def last_checked(self) -> str | None:
        return self.source.last_checked


def citation(rule: Rule) -> dict[str, str | None]:
    """A rule as the API sends it with a checklist item."""
    return {
        'name': rule.source_name,
        'url': rule.source_url,
        'version': rule.source_version,
        'lastChecked': rule.last_checked,
        'quote': rule.quote,
    }
