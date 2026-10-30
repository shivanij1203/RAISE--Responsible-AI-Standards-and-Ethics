import csv
import io

from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse

from api.models import Project
from api.serializers import ProjectSerializer
from api.services.record_docx import record_docx
from api.services.record_document import SCOPE_FULL, SCOPE_MINE, record_blocks, record_title
from api.services.record_pdf import record_pdf
from api.services.statement_docx import DOCX_MIME
from api.views.projects import user_can_access_project

RECORD_TITLE = 'AI Use Record'
RECORD_DISCLAIMER = (
    'This record lists the items RAISE suggested for this AI use and the decisions the user '
    'recorded. It is not a compliance determination and does not replace review by an IRB, '
    'General Counsel, or university policy offices.'
)


@api_view(['GET'])
def project_export(request: Request, project_id: int) -> HttpResponse | Response:
    """Export a project's AI use record (checklist items and recorded decisions) as CSV."""
    if not request.user.is_authenticated:
        return Response({"error": "Not logged in"}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        project = Project.objects.get(id=project_id, user=request.user)
    except Project.DoesNotExist:
        return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    output = io.StringIO()
    writer = csv.writer(output)

    # Title and disclaimer first, then a blank row, then the column header row.
    writer.writerow([RECORD_TITLE, project.name])
    writer.writerow([RECORD_DISCLAIMER])
    writer.writerow([])
    writer.writerow([
        'checkpoint_id', 'label', 'category', 'assigned_to',
        'completed', 'completed_at',
        'decision_description', 'decision_notes', 'proof_type', 'proof_value', 'logged_at'
    ])

    # One row per checkpoint; decisions are repeated per checkpoint
    for cp in project.checkpoints.all().order_by('id'):
        decisions = project.decisions.filter(checkpoint=cp).order_by('logged_at')
        if decisions.exists():
            for d in decisions:
                writer.writerow([
                    cp.checkpoint_id, cp.label, cp.category, cp.assigned_to,
                    cp.completed, cp.completed_at.isoformat() if cp.completed_at else '',
                    d.description, d.notes or '', d.proof_type or '', d.proof_value or '',
                    d.logged_at.isoformat(),
                ])
        else:
            writer.writerow([
                cp.checkpoint_id, cp.label, cp.category, cp.assigned_to,
                cp.completed, cp.completed_at.isoformat() if cp.completed_at else '',
                '', '', '', '', '',
            ])

    filename = f"{project.name.replace(' ', '_')}_ai_use_record.csv"
    response = HttpResponse(output.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


RECORD_FORMATS = {
    'pdf': ('application/pdf', record_pdf, 'pdf'),
    'docx': (DOCX_MIME, record_docx, 'docx'),
}
MAX_DISCLOSURE = 20000


def _record_role(user) -> str:
    """The checklist role ('pi' or 'student') for "my checklist items"."""
    role = getattr(getattr(user, 'profile', None), 'role', '')
    return 'pi' if role == 'faculty' else role


@api_view(['POST'])
def project_record(request: Request, project_id: int) -> HttpResponse | Response:
    """The AI use record as an accessible PDF or Word file. Saves nothing.

    Body: format ('pdf' or 'docx'), scope ('full' or 'mine'), disclosure
    (the statement the app shows), time_zone (so dates match the screen).
    """
    if not request.user.is_authenticated:
        return Response({"error": "Not logged in"}, status=status.HTTP_401_UNAUTHORIZED)
    project = Project.objects.filter(id=project_id).first()
    if project is None or not user_can_access_project(request.user, project):
        return Response({"error": "Activity not found"}, status=status.HTTP_404_NOT_FOUND)

    data = request.data if hasattr(request.data, 'get') else {}
    fmt = data.get('format', 'pdf')
    scope = data.get('scope', SCOPE_FULL)
    disclosure = data.get('disclosure', '')
    time_zone = data.get('time_zone') or None
    if fmt not in RECORD_FORMATS:
        return Response({"error": "format must be pdf or docx"}, status=status.HTTP_400_BAD_REQUEST)
    if scope not in (SCOPE_FULL, SCOPE_MINE):
        return Response({"error": "scope must be full or mine"}, status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(disclosure, str) or len(disclosure) > MAX_DISCLOSURE:
        return Response({"error": "disclosure must be text"}, status=status.HTTP_400_BAD_REQUEST)
    if time_zone is not None and (not isinstance(time_zone, str) or len(time_zone) > 64):
        return Response({"error": "time_zone must be a time zone name"}, status=status.HTTP_400_BAD_REQUEST)

    serialized = ProjectSerializer(project).data
    blocks = record_blocks(serialized, scope=scope, role=_record_role(request.user),
                           disclosure=disclosure, time_zone=time_zone)
    content_type, render, extension = RECORD_FORMATS[fmt]
    response = HttpResponse(render(blocks, record_title(serialized)), content_type=content_type)
    filename = f"{project.name.replace(' ', '_')}_AI_Use_Record.{extension}"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response
