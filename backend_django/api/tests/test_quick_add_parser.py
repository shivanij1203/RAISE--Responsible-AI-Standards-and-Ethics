"""Quick Add parsing: suggested names and the demo example sentences."""
from api.services.checkpoint_generator import generate_checkpoints_for_use_case
from api.services.quick_add_parser import NAME_MAX_LENGTH, parse_activity_description

TOOLS = [{'id': 1, 'name': 'ChatGPT'}]


def _parse(text: str) -> dict:
    return parse_activity_description(text, TOOLS)


class TestSuggestedName:
    def test_uses_tool_and_use_case_when_a_tool_is_named(self) -> None:
        assert _parse('Using ChatGPT to grade essays.')['name'] == 'ChatGPT for Grading & Assessment'

    def test_short_sentence_is_kept_whole(self) -> None:
        assert _parse('Screening applications with AI.')['name'] == 'Screening applications with AI'

    def test_long_sentence_is_trimmed_at_a_word_boundary(self) -> None:
        name = _parse(
            "I'm using an AI tool to help screen student applications for our MS program."
        )['name']

        assert len(name) <= NAME_MAX_LENGTH
        assert "I'm using an AI tool to help screen student applications".startswith(name)
        assert not name.endswith((' for', ' our', ' the'))
        # Never ends in the middle of a word.
        assert name.split()[-1] in "I'm using an AI tool to help screen student applications".split()


class TestDemoExampleSentences:
    """The sentences on the demo example picker (frontend constants/demoExamples.js)."""

    def test_administration_example_flags_student_data(self) -> None:
        draft = _parse("I'm using an AI tool to help screen student applications for our MS program.")
        ids = {cp['checkpoint_id'] for cp in generate_checkpoints_for_use_case(
            draft['ai_use_case'], draft['risk_context'])}

        assert draft['ai_use_case'] == 'admin'
        assert draft['risk_context']['involves_student_data'] is True
        assert 'data_deidentified' in ids

    def test_teaching_example_is_grading(self) -> None:
        draft = _parse("I'm using ChatGPT to give first-pass grades and feedback on student essays.")
        assert draft['ai_use_case'] == 'grading'

    def test_research_example_is_qualitative(self) -> None:
        draft = _parse(
            "I'm using ChatGPT to help code de-identified student interview transcripts for a research study."
        )
        assert draft['ai_use_case'] == 'qualitative'
