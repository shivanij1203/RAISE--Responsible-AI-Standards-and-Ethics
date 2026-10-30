"""The "At USF" notes shown on checklist items. Registered RAISE users are at USF.

Each note restates rules from api.rules.usf and cites them. No note says a
tool is approved for a USF data level: the sources do not say that.
"""
from dataclasses import dataclass

from api.rules import citations
from api.rules.usf import BOG_1001_NOTES, BOG_1001_STATUS


@dataclass(frozen=True)
class UsfNote:
    key: str
    text: str
    rules: tuple[str, ...]


COPILOT = UsfNote(
    key='copilot',
    text=(
        'USF supports Microsoft Copilot Chat when you sign in with your USF account. RAISE has no USF source '
        'that approves Copilot Chat, or any other tool, for a specific data level. If your funding terms '
        'require data to stay in the United States, do not use Copilot Chat.'
    ),
    rules=('usf_copilot_chat_available', 'usf_copilot_us_data_restriction'),
)
PUBLIC_TOOLS = UsfNote(
    key='public_tools',
    text=(
        'With public AI tools, do not share student data, employment data, or other protected or sensitive '
        'information. FERPA and HIPAA still apply.'
    ),
    rules=('usf_public_tools_no_sensitive_data', 'usf_public_tools_ferpa_hipaa'),
)
SYLLABUS = UsfNote(
    key='syllabus',
    text=(
        'Whether students may use AI in your course is your choice as the instructor. The Provost\'s office '
        'offers sample syllabus policies you can adapt: Acceptable Use and Restricted Use.'
    ),
    rules=('usf_instructor_discretion', 'usf_syllabus_sample_policies'),
)
BOG_SYLLABUS = UsfNote(
    key='bog_1001',
    text=BOG_1001_NOTES[BOG_1001_STATUS],
    rules=('bog_1001_syllabus_ai_proposed',),
)
THESIS = UsfNote(
    key='thesis',
    text=(
        'For a thesis or dissertation: you may use generative AI only with permission from your entire '
        'committee. Disclose any use for text or images in an appendix, and cite the model and version.'
    ),
    rules=('usf_etd_permission_and_disclosure', 'usf_etd_disclosure_appendix', 'usf_etd_cite_model_version'),
)

_DATA_NOTES = (PUBLIC_TOOLS, COPILOT)
_SYLLABUS_NOTES = (SYLLABUS, BOG_SYLLABUS)

NOTES_BY_CHECKPOINT: dict[str, tuple[UsfNote, ...]] = {
    'data_classification': _DATA_NOTES,
    'data_deidentified': _DATA_NOTES,
    'data_storage': _DATA_NOTES,
    'ferpa_compliance': _DATA_NOTES,
    'grant_nih_controlled_data': _DATA_NOTES,
    'teaching_disclosure': _SYLLABUS_NOTES,
    'grading_transparency': _SYLLABUS_NOTES,
    'ai_writing_disclosure': (THESIS,),
}


def usf_notes_for(checkpoint_id: str) -> list[dict]:
    return [
        {'key': note.key, 'text': note.text, 'sources': citations(note.rules)}
        for note in NOTES_BY_CHECKPOINT.get(checkpoint_id, ())
    ]
