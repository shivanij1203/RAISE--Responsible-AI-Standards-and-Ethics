"""The short answer at the top of an activity page, and the action cards under it.

Fixed rules only, no AI model:
  - "Check with [office] first" when an open item needs approval RAISE
    cannot give (IRB coverage, NIH controlled-access data).
  - "Change N things first" when high-priority items are open.
  - "Looks fine as described" only when no high-priority item is open.
The headline never says compliant, approved, or safe. Each "Why" line is one
short sentence that restates a rule RAISE already shows, with its source.
"""
import re
from dataclasses import dataclass

from api.rules import RULES_BY_ID, citations
from api.rules.frameworks import framework_source
from api.services.checkpoint_generator import HIGH_PRIORITY_IDS, rule_item_for
from api.services.journal_checklist import publisher_for
from api.services.usf_notes import COPILOT

NOTE = "This explains the rules that apply. It isn't a compliance decision."
FINE, CHANGE, CHECK_WITH = 'fine', 'change', 'check_with'
MAX_REASONS = 3
MAX_ACTIONS = 4

# Items whose open status needs someone else's approval.
APPROVAL_OFFICE = {'irb': 'the IRB', 'participant_consent': 'the IRB'}
CONTROLLED_DATA_ITEM = 'grant_nih_controlled_data'
CONTROLLED_DATA_WORDS = re.compile(
    r'\b(dbgap|controlled[- ]access|genomic data|data use certification|data access request)\b', re.IGNORECASE)


# ============== "Why" lines ==============

@dataclass(frozen=True)
class Why:
    text: str
    # A rule ID from api.rules, or a framework tag such as 'FERPA'.
    source: str


WHY: dict[str, Why] = {
    'irb': Why('IRB approval given before you added AI may not cover it.', 'Common Rule'),
    'participant_consent': Why('Participants have a right to know an AI tool processes their data.', 'Common Rule'),
    'data_deidentified': Why('USF says not to share student data or other protected information with public AI tools.',
                             'usf_public_tools_no_sensitive_data'),
    'ferpa_compliance': Why('Student education records are protected under FERPA.', 'FERPA'),
    'data_storage': Why('USF says not to use Copilot Chat when funding terms require data to stay in the US.',
                        'usf_copilot_us_data_restriction'),
    'data_classification': Why('Different kinds of data have different handling rules.', 'NIST AI RMF'),
    'grading_fairness': Why('AI grading can carry bias against some groups of students.', 'NIST AI RMF'),
    'bias_audit': Why('AI results can carry bias against some groups of people.', 'NIST AI RMF'),
    'grading_validation': Why('AI grades need a check against your own judgment.', 'NIST AI RMF'),
    'human_review': Why('AI makes mistakes, so a person should review what it produces.', 'NIST AI RMF'),
    'human_override': Why('Students need a way to ask a person to review an AI-assisted grade.', 'Accountability'),
    'decision_impact': Why('Decisions about people carry high stakes when AI is involved.', 'NIST AI RMF'),
    'content_accuracy': Why('AI can state wrong facts with confidence.', 'NIST AI RMF'),
    'grading_transparency': Why('At USF, AI use in coursework is the instructor\'s call, so tell students your rules.',
                                'usf_instructor_discretion'),
    'teaching_disclosure': Why('At USF, AI use in coursework is the instructor\'s call, so tell students your rules.',
                               'usf_instructor_discretion'),
    'ai_disclosure': Why('Authors should say which AI tool they used and how.', 'cope_ai_disclosure_methods'),
    'ai_writing_disclosure': Why('Authors should say which AI tool they used and how.', 'cope_ai_disclosure_methods'),
    'ai_coding_disclosure': Why('Authors should say which AI tool they used and how.', 'cope_ai_disclosure_methods'),
}


def _source(key: str) -> dict[str, str | None]:
    rule = RULES_BY_ID.get(key)
    if rule:
        return {'name': rule.source_name.split(':')[0], 'url': rule.source_url}
    source = framework_source(key)
    return {'name': source.name, 'url': source.url}


def _why_for(item_id: str, rule_ids: tuple[str, ...] = ()) -> dict | None:
    why = WHY.get(item_id)
    if why:
        return {'item': item_id, 'text': why.text, 'source': _source(why.source)}
    if rule_ids:
        rule = RULES_BY_ID[rule_ids[0]]
        return {'item': item_id, 'text': rule.summary, 'source': _source(rule.rule_id)}
    return None


# ============== Headline ==============

def _office_items(items: list[dict], description: str) -> list[tuple[dict, str]]:
    found = [(i, APPROVAL_OFFICE[i['id']]) for i in items if i['id'] in APPROVAL_OFFICE and not i['completed']]
    if CONTROLLED_DATA_WORDS.search(description or ''):
        found += [(i, 'NIH') for i in items if i['id'] == CONTROLLED_DATA_ITEM and not i['completed']]
    return found


def headline_for(items: list[dict], description: str = '') -> tuple[str, str, str | None, int]:
    """(kind, headline, office, open high-priority count) for the items' current state."""
    office_items = _office_items(items, description)
    open_high = [i for i in items if i['highPriority'] and not i['completed']]
    if office_items:
        office = office_items[0][1]
        return CHECK_WITH, f'Check with {office} first', office, len(open_high)
    if open_high:
        n = len(open_high)
        return CHANGE, f"Change {n} thing{'' if n == 1 else 's'} first", None, n
    return FINE, 'Looks fine as described', None, 0


def short_answer(items: list[dict], *, description: str = '', publisher: str | None = None) -> dict:
    """The short answer for items given as {id, completed, highPriority}.

    Items without a written "Why" line (grant, review, and journal items) use
    their first rule's summary; journal items follow the publisher.
    """
    rules_by_item = _rules_by_item([i['id'] for i in items], publisher)
    kind, headline, office, open_high = headline_for(items, description)
    office_ids = {i['id'] for i, _ in _office_items(items, description)}
    ordered = (
        [i for i in items if i['id'] in office_ids]
        + [i for i in items if i['highPriority'] and not i['completed'] and i['id'] not in office_ids]
        + [i for i in items if not i['highPriority'] and not i['completed'] and i['id'] not in office_ids]
        + [i for i in items if i['completed']]
    )
    reasons, seen_text = [], set()
    for item in ordered:
        why = _why_for(item['id'], tuple(rules_by_item.get(item['id'], ())))
        if why and why['text'] not in seen_text:
            reasons.append(why)
            seen_text.add(why['text'])
        if len(reasons) == MAX_REASONS:
            break
    return {'kind': kind, 'headline': headline, 'office': office, 'openHighPriority': open_high,
            'reasons': reasons, 'note': NOTE}


# ============== Action cards ==============

ACKNOWLEDGE, SCAN, ANONYMIZE, STATEMENT, DISCLOSURE, SUGGEST = (
    'acknowledge', 'scan', 'anonymize', 'statement', 'disclosure', 'suggest')
# Kinds the action endpoint completes; the others finish through their own flow.
SERVER_KINDS = {ACKNOWLEDGE, ANONYMIZE, DISCLOSURE}


@dataclass(frozen=True)
class Action:
    key: str
    title: str
    text: str
    kind: str
    # Candidate items, in order. A card shows when any of them is on the checklist.
    targets: tuple[str, ...]
    button: str
    # Only the first present target, for cards that answer one item.
    first_only: bool = False
    note: str = ''
    note_rules: tuple[str, ...] = ()
    # The decision recorded on each open target when the card is finished.
    decision: str = ''


ACTIONS: dict[str, Action] = {a.key: a for a in (
    Action('remove_ids', 'Remove names and IDs',
           'Scan your file for names, emails, and IDs, and take them out before any of it goes to an AI tool.',
           SCAN, ('data_deidentified', 'data_classification'), 'Scan a file'),
    Action('university_tool', "Use your university's AI tool",
           'USF supports Microsoft Copilot Chat when you sign in with your USF account.',
           ACKNOWLEDGE, ('data_storage', 'ferpa_compliance'), 'Read the USF note', first_only=True,
           note=COPILOT.text, note_rules=COPILOT.rules,
           decision=('Noted USF guidance: use Microsoft Copilot Chat with a USF login for this work, and not '
                     'when funding terms require data to stay in the United States.')),
    Action('tell_students', 'Tell your students',
           'Write a course AI statement for your syllabus, plus a short version for Canvas.',
           STATEMENT, ('grading_transparency', 'teaching_disclosure'), 'Write the statement'),
    Action('get_disclosure', 'Get your disclosure',
           'Get a disclosure statement you can paste into your paper or report.',
           DISCLOSURE, ('journal_ai_disclosure', 'ai_disclosure', 'ai_writing_disclosure', 'ai_coding_disclosure',
                        'grant_nsf_disclosure', 'admin_disclosure'), 'Get the statement',
           decision='Copied the disclosure statement from RAISE.'),
    Action('keep_judgment', 'Keep your judgment in it',
           'Start from a suggested answer for how you review AI output, then edit it to match what you do.',
           SUGGEST, ('human_review', 'grading_validation', 'grading_fairness', 'human_override', 'decision_impact',
                     'appeal_process', 'content_accuracy'), 'See suggested answers'),
    Action('irb_check', 'Check your IRB coverage',
           'Confirm your IRB protocol and consent forms cover AI. Start from a suggested answer and edit it.',
           SUGGEST, ('irb', 'participant_consent'), 'See suggested answers'),
    Action('grant_proposal', 'Check your proposal',
           'NIH will not treat an application that AI substantially developed as your own ideas.',
           ACKNOWLEDGE, ('grant_nih_originality',), 'Read the NIH rule',
           note_rules=('nih_application_originality', 'nih_ai_limited_use_allowed', 'nih_ai_misconduct_risk'),
           decision=('Confirmed AI did not substantially develop the application or any section of it, and '
                     'checked AI-assisted text and citations (NIH NOT-OD-25-132).')),
    Action('grant_controlled', 'Keep controlled data out',
           'Do not put NIH controlled-access data into public AI tools.',
           ACKNOWLEDGE, ('grant_nih_controlled_data',), 'Read the NIH rule',
           note_rules=('nih_controlled_data_no_public_ai',),
           decision='Confirmed no NIH controlled-access data goes into public or third-party AI tools '
                    '(NIH NOT-OD-25-081).'),
    Action('review_no_upload', "Don't upload the manuscript",
           'Reviewers should not upload the work they review, or any part of it, to an AI tool.',
           ACKNOWLEDGE, ('review_journal_no_upload', 'review_nih_no_ai', 'review_nsf_no_upload'), 'Read the rules',
           note_rules=('icmje_review_confidentiality_upload', 'elsevier_review_no_upload',
                       'nih_review_no_upload_confidentiality', 'nsf_review_no_upload_nonapproved_ai'),
           decision=('Confirmed I will not upload the work under review, or any part of it, to an AI tool the '
                     'journal or funder has not allowed.')),
    Action('review_disclose', 'Say so in your review',
           'If you use AI at all, tell the journal in your review report.',
           ACKNOWLEDGE, ('review_journal_disclose',), 'Read the rules',
           note_rules=('icmje_review_disclose_ai', 'elsevier_review_disclose_ai'),
           decision='Confirmed I will tell the journal about any AI use in my review.'),
)}

RESEARCH_ORDER = ('irb_check', 'remove_ids', 'university_tool', 'get_disclosure', 'keep_judgment')
CARD_ORDER: dict[str, tuple[str, ...]] = {
    'grading': ('remove_ids', 'university_tool', 'keep_judgment', 'tell_students'),
    'teaching': ('keep_judgment', 'tell_students', 'remove_ids', 'university_tool'),
    'admin': ('remove_ids', 'keep_judgment', 'university_tool', 'get_disclosure'),
    'grant_proposal': ('grant_proposal', 'grant_controlled', 'remove_ids', 'university_tool', 'get_disclosure'),
    'peer_review': ('review_no_upload', 'review_disclose', 'university_tool', 'remove_ids'),
    'journal_manuscript': ('get_disclosure', 'university_tool', 'remove_ids', 'keep_judgment'),
}


def _targets(action: Action, present: dict[str, dict]) -> list[str]:
    targets = [t for t in action.targets if t in present]
    return targets[:1] if action.first_only else targets


def _card(action: Action, targets: list[str], present: dict[str, dict], use_case: str, publisher: str | None) -> dict:
    kind, text, title = action.kind, action.text, action.title
    if action.key == 'remove_ids' and use_case == 'grading':
        kind = ANONYMIZE
        text = 'Take student names and IDs out of the essays before any of it goes to an AI tool.'
    if action.key == 'get_disclosure' and 'journal_ai_disclosure' in targets:
        text = f'Get a disclosure statement written the way {publisher_for(publisher).label} asks.'
    if action.key == 'review_no_upload' and 'review_journal_no_upload' not in targets:
        title = "Don't upload the application"
    return {
        'key': action.key,
        'title': title,
        'text': text,
        'kind': kind,
        'button': 'Remove names and IDs' if kind == ANONYMIZE else action.button,
        'targets': targets,
        'done': all(present[t]['completed'] for t in targets),
        'highPriority': any(present[t]['highPriority'] for t in targets),
        'note': action.note,
        'noteRules': [r.summary for r in (RULES_BY_ID[rid] for rid in action.note_rules)] if not action.note else [],
        'noteSources': list({c['url']: {'name': c['name'], 'url': c['url']} for c in citations(action.note_rules)}.values()),
    }


def actions_for(items: list[dict], *, use_case: str, publisher: str | None = None) -> list[dict]:
    """Up to four action cards, in a fixed order per kind of use, for the items on the checklist."""
    present = {i['id']: i for i in items}
    cards = []
    for key in CARD_ORDER.get(use_case, RESEARCH_ORDER):
        targets = _targets(ACTIONS[key], present)
        if targets:
            cards.append(_card(ACTIONS[key], targets, present, use_case, publisher))
        if len(cards) == MAX_ACTIONS:
            break
    return cards


def action_decision(key: str, *, documents: int | None = None) -> str:
    """The decision text an action records. The anonymizer names how many documents it cleaned."""
    if key == 'remove_ids':
        count = f'{documents} document{"" if documents == 1 else "s"}' if documents else 'the documents'
        return f'Removed student names and IDs from {count} with the RAISE anonymizer before any AI use.'
    return ACTIONS[key].decision


def _rules_by_item(item_ids: list[str], publisher: str | None) -> dict[str, tuple[str, ...]]:
    rules = {}
    for item_id in item_ids:
        item = rule_item_for(item_id, publisher)
        if item and item.rules:
            rules[item_id] = item.rules
    return rules


def item_states(project) -> list[dict]:
    return [
        {'id': c.checkpoint_id, 'completed': c.completed, 'highPriority': c.checkpoint_id in HIGH_PRIORITY_IDS}
        for c in project.checkpoints.order_by('id')
    ]


def project_short_answer(project) -> dict:
    """The short answer and action cards for a saved AI use, from its current checklist."""
    items = item_states(project)
    answer = short_answer(items, description=project.description, publisher=project.publisher)
    return {**answer, 'actions': actions_for(items, use_case=project.ai_use_case, publisher=project.publisher)}


def preview_short_answer(items: list[dict], *, description: str, publisher: str | None) -> dict:
    """The short answer for a landing page preview (nothing addressed yet, no action cards)."""
    states = [{'id': i['id'], 'completed': False, 'highPriority': i['highPriority']} for i in items]
    return short_answer(states, description=description, publisher=publisher)
