"""Quick Add parsing: suggested names and the demo example sentences."""
import pytest

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


class TestResearchOutputSentences:
    """Grant proposals, peer review, and journal manuscripts."""

    @pytest.mark.parametrize('sentence, use_case', [
        ('using ChatGPT to help write my NIH R01', 'grant_proposal'),
        ('Using Claude to draft specific aims for an NSF CAREER proposal', 'grant_proposal'),
        ('I use AI for grant proposal writing.', 'grant_proposal'),
        ('reviewing a manuscript with Claude', 'peer_review'),
        ('reviewing NSF proposals with ChatGPT', 'peer_review'),
        ('peer review of a journal manuscript with ChatGPT', 'peer_review'),
        ('editing my paper with AI before submitting to an Elsevier journal', 'journal_manuscript'),
        ('writing my response to reviewers with ChatGPT', 'journal_manuscript'),
        ('reviewing papers for my systematic review', 'literature'),
        ('I use AI for writing and editing.', 'writing'),
    ])
    def test_detects_the_use_case(self, sentence: str, use_case: str) -> None:
        assert _parse(sentence)['ai_use_case'] == use_case

    def test_nih_r01_names_nih(self) -> None:
        context = _parse('using ChatGPT to help write my NIH R01')['rule_context']

        assert context == {'funders': ['nih'], 'review_of': 'grant', 'publisher': None}

    def test_an_activity_code_alone_names_nih(self) -> None:
        assert _parse('drafting my K99 with Claude')['rule_context']['funders'] == ['nih']

    def test_manuscript_review_targets_the_manuscript(self) -> None:
        assert _parse('reviewing a manuscript with Claude')['rule_context']['review_of'] == 'manuscript'

    @pytest.mark.parametrize('sentence, publisher', [
        ('editing my paper with AI before submitting to an Elsevier journal', 'elsevier'),
        ('submitting to a Springer journal', 'springer_nature'),
        ('writing an IEEE conference paper with ChatGPT', 'ieee'),
        ('preparing a Taylor & Francis article with Claude', 'taylor_francis'),
        ('formatting my references in APA style with ChatGPT', None),
        ('writing my manuscript with ChatGPT', None),
    ])
    def test_detects_the_publisher(self, sentence: str, publisher: str | None) -> None:
        assert _parse(sentence)['rule_context']['publisher'] == publisher

    def test_empty_description_has_an_empty_rule_context(self) -> None:
        assert _parse('')['rule_context'] == {'funders': [], 'review_of': None, 'publisher': None}
