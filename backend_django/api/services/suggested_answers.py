"""Suggested answers for checkpoints, and the review rule for saving them.

RAISE can suggest a starting point for policy checkpoints (see
smart_defaults). A suggestion is never evidence on its own: an item is only
marked addressed from a suggestion after the person edits the text or
confirms they reviewed it. The rule is enforced here, on the server, so no
client can save an untouched suggestion in one click.
"""
from dataclasses import dataclass

from api.models import Checkpoint, Project
from api.serializers.project import infer_risk_context
from api.services.smart_defaults import generate_smart_defaults

SUGGESTED_PROOF_TYPE = 'smart_default'

SUGGESTION_REVIEW_REQUIRED = (
    'Edit the suggested answer to match what you actually did, '
    'or confirm that you reviewed it and it reflects your activity.'
)


@dataclass(frozen=True)
class SuggestionReview:
    allowed: bool
    # Recorded on the decision for suggested answers: 'edited' or 'reviewed'.
    proof_value: str = ''


def project_suggestions(project: Project, checkpoints: list[dict]) -> list[dict]:
    """Suggested answers for the given {checkpoint_id, label} items on a project."""
    checkpoint_ids = set(project.checkpoints.values_list('checkpoint_id', flat=True))
    return generate_smart_defaults(
        use_case=project.ai_use_case,
        risk_context=infer_risk_context(checkpoint_ids),
        tools=list(project.ai_tools.values_list('name', flat=True)),
        incomplete_checkpoints=checkpoints,
    )


def suggested_description(project: Project, checkpoint: Checkpoint) -> str | None:
    drafts = project_suggestions(
        project, [{'checkpoint_id': checkpoint.checkpoint_id, 'label': checkpoint.label}],
    )
    return drafts[0]['suggestedDescription'] if drafts else None


def _normalize(text: str) -> str:
    return ' '.join(text.split()).casefold()


def review_suggested_answer(
    *,
    project: Project,
    checkpoint: Checkpoint,
    description: str,
    proof_type: str,
    reviewed: bool,
) -> SuggestionReview:
    """Decide whether a decision may be saved, given the suggested answer.

    Text that still matches the suggestion needs the reviewed confirmation,
    whatever proof type the client sends. A suggested answer that was
    edited may be saved without it.
    """
    suggestion = suggested_description(project, checkpoint)
    unchanged = suggestion is not None and _normalize(description) == _normalize(suggestion)

    if unchanged and not reviewed:
        return SuggestionReview(allowed=False)
    if proof_type != SUGGESTED_PROOF_TYPE and not unchanged:
        return SuggestionReview(allowed=True)
    return SuggestionReview(allowed=True, proof_value='reviewed' if unchanged else 'edited')
