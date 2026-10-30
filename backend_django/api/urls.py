from django.urls import path

from .views.auth import register, login_view, logout_view, me, demo_start
from .views.health import health
from .views.preview import preview
from .views.projects import project_list_create, project_detail, checkpoint_toggle, decision_create, quick_add_parse, grading_prompt_view, smart_defaults_view, activity_library, activity_library_detail
from .views.tools import ai_tool_list_create, ai_tool_update, ai_tool_detail, tool_insights
from .views.dashboard import dashboard_stats
from .views.comments import checkpoint_comments, checkpoint_comment_resolve
from .views.assessment import assessment_questions, assessment_submit
from .views.export import project_export
from .views.timeline import project_timeline
from .views.verification import scan_file_for_pii, classify_data, bias_audit_view, get_file_columns, redact_pii_in_file, extract_pdf_text, blind_grade_csv, merge_graded_grades, anonymize_documents
from .views.usage import usage_event
from .views.notifications import notification_list, notification_mark_read, notification_mark_all_read
from .views.invitations import (
    project_invitations_create,
    project_invitations_list,
    my_pending_invitations,
    invitation_accept,
    invitation_decline,
    invitation_cancel,
)

urlpatterns = [
    # Health check (no auth) for uptime monitors and keep-warm pings
    path('health', health, name='health'),
    path('preview', preview, name='preview'),

    # Auth endpoints
    path('auth/register', register, name='register'),
    path('auth/login', login_view, name='login'),
    path('auth/logout', logout_view, name='logout'),
    path('auth/me', me, name='me'),
    path('auth/demo', demo_start, name='demo-start'),

    # Project endpoints
    path('projects', project_list_create, name='project-list-create'),
    path('projects/quick-add/parse', quick_add_parse, name='project-quick-add-parse'),
    path('projects/<int:project_id>/grading-prompt', grading_prompt_view, name='project-grading-prompt'),
    path('projects/<int:project_id>/smart-defaults', smart_defaults_view, name='project-smart-defaults'),
    path('activities/library', activity_library, name='activity-library'),
    path('activities/library/<int:project_id>', activity_library_detail, name='activity-library-detail'),
    path('projects/<int:project_id>', project_detail, name='project-detail'),
    path('projects/<int:project_id>/checkpoints/<str:checkpoint_id>', checkpoint_toggle, name='checkpoint-toggle'),
    path('projects/<int:project_id>/decisions', decision_create, name='decision-create'),
    path('projects/<int:project_id>/export', project_export, name='project-export'),
    path('projects/<int:project_id>/timeline', project_timeline, name='project-timeline'),

    # Dashboard endpoint
    path('dashboard/stats', dashboard_stats, name='dashboard-stats'),

    # AI Tool Registry endpoints
    path('tools', ai_tool_list_create, name='tool-list-create'),
    path('tools/<int:tool_id>', ai_tool_update, name='tool-update'),
    path('tools/<int:tool_id>/detail', ai_tool_detail, name='tool-detail'),
    path('tools/insights', tool_insights, name='tool-insights'),

    # Checkpoint Comment endpoints
    path('projects/<int:project_id>/checkpoints/<str:checkpoint_id>/comments',
         checkpoint_comments, name='checkpoint-comments'),
    path('projects/<int:project_id>/checkpoints/<str:checkpoint_id>/comments/<int:comment_id>/resolve',
         checkpoint_comment_resolve, name='checkpoint-comment-resolve'),

    # Verification endpoints (automated checkpoint checks)
    path('verify/scan-pii', scan_file_for_pii, name='scan-pii'),
    path('verify/classify-data', classify_data, name='classify-data'),
    path('verify/bias-audit', bias_audit_view, name='bias-audit'),
    path('verify/file-columns', get_file_columns, name='file-columns'),
    path('verify/redact-pii', redact_pii_in_file, name='redact-pii'),
    path('verify/extract-pdf', extract_pdf_text, name='extract-pdf'),
    path('verify/blind-grade-csv', blind_grade_csv, name='blind-grade-csv'),
    path('verify/merge-grades', merge_graded_grades, name='merge-grades'),
    path('verify/anonymize-documents', anonymize_documents, name='anonymize-documents'),

    # Assessment endpoints
    path('assessment/questions', assessment_questions, name='assessment-questions'),
    path('assessment/submit', assessment_submit, name='assessment-submit'),

    # Anonymous usage counts for browser-only actions (copy, export)
    path('usage', usage_event, name='usage-event'),

    # Notification endpoints
    path('notifications', notification_list, name='notification-list'),
    path('notifications/read-all', notification_mark_all_read, name='notification-mark-all-read'),
    path('notifications/<int:notification_id>/read', notification_mark_read, name='notification-mark-read'),

    # Collaboration invitation endpoints
    path('projects/<int:project_id>/invitations', project_invitations_create, name='project-invitations-create'),
    path('projects/<int:project_id>/invitations/list', project_invitations_list, name='project-invitations-list'),
    path('invitations/pending', my_pending_invitations, name='invitations-pending'),
    path('invitations/<int:invitation_id>/accept', invitation_accept, name='invitation-accept'),
    path('invitations/<int:invitation_id>/decline', invitation_decline, name='invitation-decline'),
    path('invitations/<int:invitation_id>', invitation_cancel, name='invitation-cancel'),
]
