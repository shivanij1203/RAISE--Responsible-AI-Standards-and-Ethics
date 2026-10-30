"""The AI Use Record as an ordered list of blocks, for the PDF and Word exports.

Built from the same serialized project the app shows (ProjectSerializer), so
the record matches the screen. The order is the reading order: title,
disclaimer, use summary, checklist items with status, decisions and
sources, then the disclosure statement. Both renderers (record_pdf.py and
record_docx.py) keep this order and turn headings into real headings.
"""
from dataclasses import dataclass
from datetime import date, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from api.services.quick_add_parser import USE_CASE_LABELS

RECORD_TITLE = 'AI Use Record'
# Same wording as the CSV export (api/views/export.py).
RECORD_DISCLAIMER = (
    'This record lists the items RAISE suggested for this AI use and the decisions the user '
    'recorded. It is not a compliance determination and does not replace review by an IRB, '
    'General Counsel, or university policy offices.'
)
PRODUCED_BY = 'Produced by RAISE (Responsible AI Standards & Ethics), a research prototype.'
CONTACT_LINE = ('For questions about what applies to your work, contact your IRB, General Counsel, '
                'or the relevant university policy office.')
LOGO_ALT_TEXT = 'RAISE logo: a shield made of checklist lines with the first line checked'

SCOPE_FULL = 'full'
SCOPE_MINE = 'mine'

TITLE, HEADING, SUBHEADING, PARAGRAPH, ITEM = 'title', 'heading', 'subheading', 'paragraph', 'item'


@dataclass(frozen=True)
class Block:
    kind: str
    text: str
    # Detail lines under an item, in order.
    lines: tuple[str, ...] = ()
    # A link for the item's first detail line, when it is a URL.
    link: str | None = None


def _zone(name: str | None) -> ZoneInfo:
    try:
        return ZoneInfo(name or 'UTC')
    except (ZoneInfoNotFoundError, ValueError):
        return ZoneInfo('UTC')


def _day(value: str | datetime | date | None, zone: ZoneInfo) -> str:
    """'October 30, 2026' in the reader's time zone, as the screen shows it."""
    if not value:
        return ''
    if isinstance(value, str):
        value = datetime.fromisoformat(value)
    if isinstance(value, datetime):
        value = value.astimezone(zone).date()
    return f'{value:%B} {value.day}, {value.year}'


def _role_label(assigned_to: str) -> str:
    return 'Faculty / PI' if assigned_to == 'pi' else 'Student'


def _high_priority(checkpoints: list[dict]) -> str:
    high = [c for c in checkpoints if c.get('highPriority')]
    open_count = sum(1 for c in high if not c['completed'])
    if not high:
        return 'No high-priority items on this checklist'
    if open_count == 0:
        return 'All high-priority items addressed'
    return f"{open_count} high-priority item{'' if open_count == 1 else 's'} open"


def _evidence(decision: dict) -> str:
    if decision.get('proofType') == 'smart_default':
        return ('Suggested answer, edited' if decision.get('proofValue') == 'edited'
                else 'Suggested answer, confirmed as reviewed')
    return decision.get('proofValue') or 'None'


def _checkpoint_blocks(checkpoint: dict, zone: ZoneInfo) -> Block:
    info = checkpoint.get('kind') == 'info'
    if checkpoint['completed']:
        status = f"Status: {'Read' if info else 'Addressed'} on {_day(checkpoint.get('completedAt'), zone)}"
    else:
        status = 'Status: Open'
    lines = [status]
    if checkpoint.get('highPriority'):
        lines.append('High priority')
    lines.append(f"Assigned to: {_role_label(checkpoint['assignedTo'])}")
    if not checkpoint['completed'] and checkpoint.get('how'):
        lines.append(f"How to address it: {checkpoint['how']}")
    return Block(ITEM, checkpoint['label'], tuple(lines))


def _source_blocks(checkpoints: list[dict]) -> list[Block]:
    """Each source once, in the order items cite them."""
    seen: dict[str, dict] = {}
    for checkpoint in checkpoints:
        for source in checkpoint.get('sources') or []:
            seen.setdefault(source.get('url') or source['name'], source)
    blocks = []
    for source in seen.values():
        if not source.get('url'):
            blocks.append(Block(ITEM, source['name'], ('No linked source; shown as a label.',)))
            continue
        lines = [source['url']]
        if source.get('version'):
            lines.append(f"Page date: {source['version']}")
        if source.get('lastChecked'):
            lines.append(f"Checked by RAISE: {_day(date.fromisoformat(source['lastChecked']), ZoneInfo('UTC'))}")
        blocks.append(Block(ITEM, source['name'], tuple(lines), link=source['url']))
    return blocks


def record_title(project: dict) -> str:
    return f"{RECORD_TITLE}: {project['name']}"


def record_blocks(
    project: dict,
    *,
    scope: str = SCOPE_FULL,
    role: str = 'pi',
    disclosure: str = '',
    time_zone: str | None = None,
    now: datetime | None = None,
) -> list[Block]:
    """The record for a serialized project, in reading order."""
    zone = _zone(time_zone)
    now = now or datetime.now(tz=zone)
    all_checkpoints = project['checkpoints']
    checkpoints = [c for c in all_checkpoints if c['assignedTo'] == role] if scope == SCOPE_MINE else all_checkpoints
    done = sum(1 for c in checkpoints if c['completed'])
    overall = ''
    if scope == SCOPE_MINE:
        overall = f" ({sum(1 for c in all_checkpoints if c['completed'])} of {len(all_checkpoints)} across all roles)"
    labels = {c['id']: c['label'] for c in all_checkpoints}
    decisions = project.get('decisions') or []

    blocks = [
        Block(TITLE, RECORD_TITLE),
        Block(PARAGRAPH, project['name']),
        Block(PARAGRAPH, f'Generated {_day(now, zone)}. '
                         + (f"Checklist items assigned to {_role_label(role)}." if scope == SCOPE_MINE
                            else 'All checklist items across all roles.')),
        Block(PARAGRAPH, f'{RECORD_DISCLAIMER} {PRODUCED_BY}'),
        Block(HEADING, '1. About this AI use'),
        Block(PARAGRAPH, f"Name: {project['name']}"),
        Block(PARAGRAPH, f"Kind of use: {USE_CASE_LABELS.get(project['aiUseCase'], 'Not specified')}"),
        Block(PARAGRAPH, f"Description: {project.get('description') or 'None provided'}"),
        Block(PARAGRAPH, f"Date created: {_day(project['createdAt'], zone)}"),
        Block(PARAGRAPH, f'Items addressed: {done} of {len(checkpoints)}{overall}'),
        Block(PARAGRAPH, f'High-priority items: {_high_priority(checkpoints)}'),
        Block(PARAGRAPH, f'Decisions recorded: {len(decisions)}'),
        Block(HEADING, '2. Checklist'),
    ]
    # Categories in the order they first appear, as on the screen.
    for category in dict.fromkeys(c['category'] for c in checkpoints):
        in_category = [c for c in checkpoints if c['category'] == category]
        addressed = sum(1 for c in in_category if c['completed'])
        blocks.append(Block(SUBHEADING, f'{category} ({addressed} of {len(in_category)} addressed)'))
        blocks += [_checkpoint_blocks(c, zone) for c in in_category]

    blocks += [Block(HEADING, '3. Decisions and sources'), Block(SUBHEADING, 'Decisions')]
    if not decisions:
        blocks.append(Block(PARAGRAPH, 'No decisions have been recorded for this AI use.'))
    for decision in decisions:
        lines = [f"Decision: {decision['description']}"]
        if decision.get('notes'):
            lines.append(f"Note: {decision['notes']}")
        lines.append(f'Evidence: {_evidence(decision)}')
        if decision.get('toolUsed'):
            lines.append(f"Tool used: {decision['toolUsed']['name']}")
        item = labels.get(decision['checkpoint'], 'General')
        blocks.append(Block(ITEM, f"{_day(decision['loggedAt'], zone)}: {item}", tuple(lines)))
    blocks.append(Block(SUBHEADING, 'Sources'))
    blocks += _source_blocks(checkpoints) or [Block(PARAGRAPH, 'No sources are listed for these items.')]

    blocks.append(Block(HEADING, '4. Disclosure statement'))
    disclosure_lines = [line.strip() for line in disclosure.splitlines() if line.strip()]
    blocks += [Block(PARAGRAPH, line) for line in disclosure_lines] or [
        Block(PARAGRAPH, 'No disclosure statement was included.')]
    blocks.append(Block(PARAGRAPH, f'Record generated on {_day(now, zone)}. {CONTACT_LINE}'))
    return blocks
