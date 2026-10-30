"""Record a decision on a checklist item and mark the item addressed.

One path for every way a decision is saved (the Log form, a scan result, a
suggested answer, an action card, a course statement), so each one leaves
the same audit trail and notifications.
"""
from django.contrib.auth.models import User
from django.utils import timezone

from api.models import AITool, Checkpoint, Decision, Project
from api.services import audit_service, notification_service


def record_decision(
    project: Project,
    checkpoint: Checkpoint,
    *,
    actor: User,
    description: str,
    notes: str = '',
    proof_type: str = '',
    proof_value: str = '',
    tool_used: AITool | None = None,
) -> Decision:
    decision = Decision.objects.create(
        project=project,
        checkpoint=checkpoint,
        description=description,
        notes=notes,
        proof_type=proof_type,
        proof_value=proof_value,
        tool_used=tool_used,
    )
    audit_service.record_decision_logged(decision, actor=actor)

    if not checkpoint.completed:
        checkpoint.completed = True
        checkpoint.completed_at = timezone.now()
        checkpoint.save()
        decision.refresh_from_db(fields=['checkpoint'])
        notification_service.notify_checkpoint_completed(checkpoint, actor=actor)
        audit_service.record_checkpoint_completed(checkpoint, actor=actor)
    return decision
