from django.db import migrations


# Checkpoint labels describe a task for the person, not a verdict. Labels are
# stored on each Checkpoint row, so existing rows are updated by checkpoint_id.
# checkpoint_id values do not change.
#
# Inlined snapshot (old label, new label) so this migration stays
# self-contained if checkpoint_generator changes later.
_LABELS: dict[str, tuple[str, str]] = {
    'irb': ('IRB Status Confirmed', 'Confirm your IRB protocol covers AI use'),
    'data_classification': ('Data Classification Determined', 'Classify the data you will use'),
    'ai_disclosure': ('AI Use Disclosure Planned', 'Plan how you will disclose AI use'),
    'data_deidentified': ('Data De-identification Verified', 'Check that the data is de-identified'),
    'data_storage': ('Secure Storage Confirmed', 'Confirm where data and AI outputs are stored'),
    'bias_audit': ('Bias Audit Conducted', 'Check results for bias'),
    'human_review': ('Human Review Process Defined', 'Decide how a person reviews AI output'),
    'ai_coding_disclosure': ('AI-Assisted Coding Disclosed', 'Disclose AI-assisted coding'),
    'participant_consent': ('Participant Consent Covers AI', 'Check that participant consent covers AI use'),
    'ai_writing_disclosure': ('AI Writing Assistance Disclosed', 'Disclose AI writing assistance'),
    'grading_fairness': ('Grading Fairness Audit', 'Check AI grades for fairness'),
    'ferpa_compliance': ('FERPA Compliance Verified', 'Check whether FERPA applies to this data'),
    'grading_transparency': ('Grading Criteria Disclosed to Students', 'Share grading criteria with students'),
    'human_override': ('Human Override Process Defined', 'Decide how you will override AI grades'),
    'grading_validation': ('AI Grading Output Validated', 'Spot-check AI grades against your own'),
    'content_accuracy': ('Content Accuracy Verified', 'Check AI-generated content for accuracy'),
    'accessibility_check': ('Accessibility Standards Met', 'Check materials for accessibility'),
    'ip_review': ('Intellectual Property Reviewed', 'Review intellectual property questions'),
    'teaching_disclosure': ('AI Use Disclosed to Students', 'Tell students how you use AI'),
    'material_review_cycle': ('Periodic Review Cycle Established', 'Set a date to review this use again'),
    'decision_impact': ('Decision Impact Assessment Completed', 'Assess how AI affects decisions about people'),
    'appeal_process': ('Appeal / Recourse Process Defined', 'Define how people can appeal a decision'),
    'admin_bias_audit': ('Bias Audit for Administrative Decisions', 'Check administrative decisions for bias'),
    'data_minimization': ('Data Minimization Verified', 'Use only the data you need'),
    'admin_disclosure': ('AI Use Disclosed to Affected Parties', 'Tell affected people how AI is used'),
}


def _relabel(apps, index: int) -> None:
    Checkpoint = apps.get_model('api', 'Checkpoint')
    for checkpoint_id, labels in _LABELS.items():
        Checkpoint.objects.filter(checkpoint_id=checkpoint_id).update(label=labels[index])


def use_task_labels(apps, schema_editor) -> None:
    _relabel(apps, 1)


def restore_verdict_labels(apps, schema_editor) -> None:
    _relabel(apps, 0)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0017_backfill_project_category'),
    ]

    operations = [
        migrations.RunPython(use_task_labels, restore_verdict_labels),
    ]
