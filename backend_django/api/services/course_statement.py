"""Build a course AI statement for a syllabus from what a professor recorded in RAISE.

The statement has two parts: how the professor uses AI in the course (one
plain sentence per chosen AI use, plus what their completed checklist items
show they do), and what students may use AI for (a USF Provost sample policy
or their own, plus allowed and not allowed uses). A short student-facing
version is built from the same choices.

Nothing here says the statement meets a legal or policy requirement.
"""
import re
from dataclasses import dataclass, field

from api.models import Project
from api.rules import citations
from api.rules.usf import BOG_1001_STATUS, SYLLABUS_SAMPLES

ACCEPTABLE = 'acceptable'
RESTRICTED = 'restricted'
CUSTOM = 'custom'
POLICIES = (ACCEPTABLE, RESTRICTED, CUSTOM)

@dataclass(frozen=True)
class StudentUse:
    # Checkbox label for the professor.
    label: str
    # Phrase in the statement, which speaks to students as "you".
    phrase: str


# Student uses a professor can mark allowed or not allowed, in display order.
STUDENT_USES: dict[str, StudentUse] = {
    'brainstorming': StudentUse('Brainstorming and exploring ideas', 'brainstorming and exploring ideas'),
    'grammar': StudentUse('Grammar and spelling help', 'grammar and spelling help'),
    'feedback': StudentUse('Feedback on their own drafts', 'feedback on your own drafts'),
    'summaries': StudentUse('Summarizing readings or research', 'summarizing readings or research'),
    'studying': StudentUse('Studying and practice questions', 'studying and practice questions'),
    'coding': StudentUse('Coding help and debugging', 'coding help and debugging'),
    'drafting': StudentUse('Drafting text they submit', 'drafting text you submit'),
    'translation': StudentUse('Translating text', 'translating text'),
    'images': StudentUse('Creating images or media', 'creating images or media'),
}

FACULTY_HEADING = 'How I use AI in this course'
STUDENT_HEADING = 'How you may use AI in this course'
STUDENT_VERSION_TITLE = 'How AI is used in this course'
SECTION_HEADINGS = (FACULTY_HEADING, STUDENT_HEADING)

NO_FACULTY_USE = '[Describe how you use AI in this course, or say that you do not use it.]'
ASK_FIRST = 'If you are not sure whether a use is allowed, ask me before you use it.'

# What a completed checklist item shows the professor does, in plain words.
# Only completed items count, so each sentence reflects something recorded.
COMMITMENTS: tuple[tuple[frozenset[str], str], ...] = (
    (frozenset({'grading_validation'}), 'I check AI-suggested grades against my own judgment.'),
    (frozenset({'human_review'}), 'I review AI output before I use it.'),
    (frozenset({'content_accuracy'}), 'I check AI-made materials for accuracy before I share them.'),
    (frozenset({'data_deidentified'}), 'I do not enter student names or IDs into AI tools.'),
    (frozenset({'ferpa_compliance'}), 'I protect student records under FERPA when I use AI.'),
    (frozenset({'grading_fairness', 'bias_audit'}), 'I check AI-assisted grades for fairness across students.'),
    (frozenset({'human_override', 'appeal_process'}),
     'You can ask me to review any grade or decision that AI helped with.'),
    (frozenset({'accessibility_check'}), 'I check AI-made course materials for accessibility.'),
)

# Short phrases for a use case when the recorded sentence cannot be reused.
USE_CASE_PHRASES: dict[str, str] = {
    'grading': 'help with grading and feedback',
    'teaching': 'help prepare course materials',
    'writing': 'help with writing and editing',
    'literature': 'help review the literature',
    'admin': 'help with course administration',
}
DEFAULT_PHRASE = 'help with parts of my work'

_SENTENCE_END = re.compile(r'(?<=[.!?])\s+')
# "I'm using ChatGPT to give feedback..." -> tool "ChatGPT", task "give feedback..."
_USING_TO = re.compile(r"^(?:i'?m|i am|we'?re|we are|i)\s+(?:using|use)\s+(.+?)\s+to\s+(.+)$", re.IGNORECASE)
_BARE_USING_TO = re.compile(r'^using\s+(.+?)\s+to\s+(.+)$', re.IGNORECASE)


@dataclass(frozen=True)
class StatementChoices:
    course_name: str
    term: str
    projects: list[Project] = field(default_factory=list)
    policy: str = CUSTOM
    allowed: list[str] = field(default_factory=list)
    not_allowed: list[str] = field(default_factory=list)
    cite_line: str = ''


def _join(items: list[str]) -> str:
    if len(items) <= 2:
        return ' and '.join(items)
    return f"{', '.join(items[:-1])}, and {items[-1]}"


def _tools(project: Project) -> str:
    names = list(project.ai_tools.order_by('name').values_list('name', flat=True))
    return _join(names) if names else 'an AI tool'


def _split_description(project: Project) -> tuple[str, list[str]]:
    """The recorded description's first sentence, and any sentences after it."""
    sentences = [s.strip() for s in _SENTENCE_END.split((project.description or '').strip()) if s.strip()]
    return (sentences[0] if sentences else ''), sentences[1:]


def _tool_and_task(project: Project) -> tuple[str, str, bool]:
    """The tool and task, and whether they came from the recorded first sentence."""
    first, _rest = _split_description(project)
    sentence = first.rstrip('.!?').strip()
    match = _USING_TO.match(sentence) or _BARE_USING_TO.match(sentence)
    if match:
        return match.group(1), match.group(2), True
    return _tools(project), USE_CASE_PHRASES.get(project.ai_use_case, DEFAULT_PHRASE), False


def _commitments(project: Project) -> list[str]:
    done = set(project.checkpoints.filter(completed=True).values_list('checkpoint_id', flat=True))
    return [sentence for ids, sentence in COMMITMENTS if ids & done]


def faculty_sentence(project: Project) -> str:
    """One plain paragraph about one AI use: what the professor uses, what else they
    recorded about it, and what their completed checklist items show they do."""
    tool, task, from_description = _tool_and_task(project)
    recorded = _split_description(project)[1] if from_description else []
    return ' '.join([f'I use {tool} to {task}.', *recorded, *_commitments(project)])


def _student_phrase_list(keys: list[str]) -> str:
    return _join([STUDENT_USES[k].phrase for k in keys if k in STUDENT_USES])


def _student_lines(choices: StatementChoices) -> list[str]:
    lines: list[str] = []
    allowed = _student_phrase_list(choices.allowed)
    not_allowed = _student_phrase_list(choices.not_allowed)
    if allowed:
        lines.append(f'You may use AI for {allowed}.')
    if not_allowed:
        lines.append(f'You may not use AI for {not_allowed}.')
    if choices.cite_line.strip():
        lines.append(f'How to cite or disclose AI use: {choices.cite_line.strip()}')
    return lines


def build_statement(choices: StatementChoices) -> str:
    """The full syllabus statement as plain text: a title line, two section
    heading lines, and paragraphs separated by blank lines."""
    faculty = [faculty_sentence(p) for p in choices.projects] or [NO_FACULTY_USE]
    student: list[str] = []
    sample = SYLLABUS_SAMPLES.get(choices.policy)
    if sample:
        student += list(sample.paragraphs)
    student += _student_lines(choices)
    if not sample:
        student.append(ASK_FIRST)

    blocks = [f'AI in {choices.course_name} ({choices.term})', FACULTY_HEADING, *faculty, STUDENT_HEADING, *student]
    if sample:
        blocks.append(f'Student AI policy adapted from the USF Office of the Provost sample '
                      f'"{sample.title}": {sample.source.url}')
    return '\n\n'.join(blocks) + '\n'


def _student_summary(choices: StatementChoices) -> str:
    if choices.allowed or choices.not_allowed:
        return ' '.join(_student_lines(choices))
    if choices.policy == ACCEPTABLE:
        return 'You may use AI tools for course work, following the AI policy in the syllabus.'
    if choices.policy == RESTRICTED:
        return 'You may not use AI tools for any course work unless an assignment says otherwise.'
    return 'The syllabus explains when you may use AI in this course.'


def build_student_version(choices: StatementChoices) -> str:
    """A short, plain version for a Canvas announcement."""
    tasks = [_tool_and_task(p)[1] for p in choices.projects]
    reviews = any(_commitments(p) for p in choices.projects)
    if tasks:
        faculty = f'In {choices.course_name}, I use AI to {_join(tasks)}.' + (
            ' I check its output myself.' if reviews else '')
    else:
        faculty = f'In {choices.course_name}, I do not use AI in ways that affect your work.'
    blocks = [STUDENT_VERSION_TITLE, faculty, _student_summary(choices)]
    if choices.cite_line.strip() and not (choices.allowed or choices.not_allowed):
        blocks.append(f'How to cite or disclose AI use: {choices.cite_line.strip()}')
    blocks.append(ASK_FIRST)
    return '\n\n'.join(blocks) + '\n'


def bog_note() -> dict:
    """The note on Florida BOG Regulation 1.001. Pending unless the status constant says adopted."""
    adopted = BOG_1001_STATUS == 'adopted'
    status = 'adopted' if adopted else 'pending'
    text = (
        'Florida\'s Board of Governors has adopted a rule asking each university to set AI disclosure '
        'policies for syllabi. Status: adopted. Check USF\'s policy for what your syllabus needs.'
        if adopted else
        f'Florida\'s Board of Governors has proposed requiring AI disclosure in syllabi. Status: {status}.'
    )
    return {'status': status, 'text': text, 'sources': citations(('bog_1001_syllabus_ai_proposed',))}
