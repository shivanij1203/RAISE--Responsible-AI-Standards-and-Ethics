"""Course AI statements: build, save, reopen, and download a syllabus AI statement."""
import re

from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from api.models import CourseStatement, UsageEvent
from api.rules.usf import SYLLABUS_SAMPLES
from api.services.course_statement import (
    POLICIES,
    STUDENT_USES,
    StatementChoices,
    bog_note,
    build_statement,
    build_student_version,
    faculty_sentence,
)
from api.services.statement_docx import DOCX_MIME, statement_docx
from api.services.usage import record_usage
from api.views.projects import get_user_projects

MAX_TEXT = 20000
SUGGESTED_KINDS = {'teaching', 'grading'}


class ChoiceError(ValueError):
    pass


def _not_logged_in() -> Response:
    return Response({'error': 'Not logged in'}, status=status.HTTP_401_UNAUTHORIZED)


def _text(data, key: str, limit: int, required: bool = False) -> str:
    value = data.get(key, '')
    if not isinstance(value, str):
        raise ChoiceError(f'{key} must be text.')
    value = value.strip()
    if required and not value:
        raise ChoiceError(f'{key} is required.')
    if len(value) > limit:
        raise ChoiceError(f'{key} must be {limit} characters or fewer.')
    return value


def _uses(data, key: str) -> list[str]:
    value = data.get(key, [])
    if not isinstance(value, list) or any(v not in STUDENT_USES for v in value):
        raise ChoiceError(f"{key} must list student uses from: {', '.join(STUDENT_USES)}.")
    return [k for k in STUDENT_USES if k in value]


def _choices(data, user) -> StatementChoices:
    """Validate the professor's choices. Projects are limited to ones they can see."""
    if not hasattr(data, 'get'):
        raise ChoiceError('Send the statement choices as JSON.')
    project_ids = data.get('project_ids', [])
    if not isinstance(project_ids, list) or not all(isinstance(i, (int, str)) for i in project_ids):
        raise ChoiceError('project_ids must be a list of AI use IDs.')
    try:
        wanted = [int(i) for i in project_ids]
    except ValueError as exc:
        raise ChoiceError('project_ids must be a list of AI use IDs.') from exc
    by_id = {p.id: p for p in get_user_projects(user).filter(id__in=wanted)}
    if len(by_id) != len(set(wanted)):
        raise ChoiceError('One or more AI uses were not found.')
    policy = data.get('policy', 'custom')
    if policy not in POLICIES:
        raise ChoiceError(f"policy must be one of: {', '.join(POLICIES)}.")
    allowed, not_allowed = _uses(data, 'allowed'), _uses(data, 'not_allowed')
    if set(allowed) & set(not_allowed):
        raise ChoiceError('A student use cannot be both allowed and not allowed.')
    return StatementChoices(
        course_name=_text(data, 'course_name', 200, required=True),
        term=_text(data, 'term', 100, required=True),
        projects=[by_id[i] for i in dict.fromkeys(wanted)],
        policy=policy,
        allowed=allowed,
        not_allowed=not_allowed,
        cite_line=_text(data, 'cite_line', 500),
    )


def _bad(exc: Exception) -> Response:
    return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


def _serialize(statement: CourseStatement) -> dict:
    return {
        'id': statement.id,
        'courseName': statement.course_name,
        'term': statement.term,
        'projectIds': list(statement.projects.order_by('id').values_list('id', flat=True)),
        'policy': statement.student_policy,
        'allowed': statement.allowed_uses,
        'notAllowed': statement.not_allowed_uses,
        'citeLine': statement.cite_line,
        'statementText': statement.statement_text,
        'studentText': statement.student_text,
        'createdAt': statement.created_at.isoformat(),
        'updatedAt': statement.updated_at.isoformat(),
    }


def _apply(statement: CourseStatement, choices: StatementChoices) -> None:
    statement.course_name = choices.course_name
    statement.term = choices.term
    statement.student_policy = choices.policy
    statement.allowed_uses = choices.allowed
    statement.not_allowed_uses = choices.not_allowed
    statement.cite_line = choices.cite_line


@api_view(['GET'])
def course_statement_options(request: Request) -> Response:
    """What the flow offers: the user's AI uses, the Provost samples, student uses, and the BOG note."""
    if not request.user.is_authenticated:
        return _not_logged_in()
    ai_uses = [
        {
            'id': p.id,
            'name': p.name,
            'aiUseCase': p.ai_use_case,
            'category': p.category,
            'sentence': faculty_sentence(p),
            'suggested': p.ai_use_case in SUGGESTED_KINDS or p.category in SUGGESTED_KINDS,
        }
        for p in get_user_projects(request.user).prefetch_related('ai_tools')
    ]
    policies = [
        {
            'key': sample.key,
            'title': sample.title,
            'paragraphs': list(sample.paragraphs),
            'source': {'name': sample.source.name, 'url': sample.source.url,
                       'version': sample.source.version, 'lastChecked': sample.source.last_checked},
        }
        for sample in SYLLABUS_SAMPLES.values()
    ]
    return Response({
        'aiUses': ai_uses,
        'policies': policies,
        'studentUses': [{'key': k, 'label': v.label} for k, v in STUDENT_USES.items()],
        'bogNote': bog_note(),
    })


@api_view(['POST'])
def course_statement_draft(request: Request) -> Response:
    """Build the statement and the student version from the choices. Saves nothing."""
    if not request.user.is_authenticated:
        return _not_logged_in()
    try:
        choices = _choices(request.data, request.user)
    except ChoiceError as exc:
        return _bad(exc)
    return Response({'statementText': build_statement(choices), 'studentText': build_student_version(choices)})


@api_view(['GET', 'POST'])
def course_statement_list_create(request: Request) -> Response:
    if not request.user.is_authenticated:
        return _not_logged_in()
    if request.method == 'GET':
        return Response([_serialize(s) for s in request.user.course_statements.all()])
    try:
        choices = _choices(request.data, request.user)
        statement_text = _text(request.data, 'statement_text', MAX_TEXT) or build_statement(choices)
        student_text = _text(request.data, 'student_text', MAX_TEXT) or build_student_version(choices)
    except ChoiceError as exc:
        return _bad(exc)
    statement = CourseStatement(user=request.user, statement_text=statement_text, student_text=student_text)
    _apply(statement, choices)
    statement.save()
    statement.projects.set(choices.projects)
    record_usage(UsageEvent.COURSE_STATEMENT_CREATED, user=request.user)
    return Response(_serialize(statement), status=status.HTTP_201_CREATED)


def _own_statement(request: Request, statement_id: int) -> CourseStatement | None:
    return request.user.course_statements.filter(id=statement_id).first()


@api_view(['GET', 'PUT', 'DELETE'])
def course_statement_detail(request: Request, statement_id: int) -> Response:
    if not request.user.is_authenticated:
        return _not_logged_in()
    statement = _own_statement(request, statement_id)
    if statement is None:
        return Response({'error': 'Statement not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        return Response(_serialize(statement))
    if request.method == 'DELETE':
        statement.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    try:
        choices = _choices(request.data, request.user) if 'course_name' in request.data else None
        texts = {key: _text(request.data, key, MAX_TEXT)
                 for key in ('statement_text', 'student_text') if key in request.data}
    except ChoiceError as exc:
        return _bad(exc)
    if choices:
        _apply(statement, choices)
    for key, value in texts.items():
        setattr(statement, key, value)
    statement.save()
    if choices:
        statement.projects.set(choices.projects)
    return Response(_serialize(statement))


def _filename(course_name: str) -> str:
    safe = re.sub(r'[^A-Za-z0-9 ._-]+', '', course_name).strip() or 'Course'
    return f'{safe} AI statement.docx'


@api_view(['GET'])
def course_statement_docx(request: Request, statement_id: int) -> HttpResponse:
    """The saved statement and student version as a Word document."""
    if not request.user.is_authenticated:
        return _not_logged_in()
    statement = _own_statement(request, statement_id)
    if statement is None:
        return Response({'error': 'Statement not found'}, status=status.HTTP_404_NOT_FOUND)
    content = statement_docx(statement.statement_text, statement.student_text, statement.course_name)
    response = HttpResponse(content, content_type=DOCX_MIME)
    response['Content-Disposition'] = f'attachment; filename="{_filename(statement.course_name)}"'
    return response
