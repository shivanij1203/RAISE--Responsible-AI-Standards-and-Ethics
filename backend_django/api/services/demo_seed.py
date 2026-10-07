"""Build demo accounts and demo activities.

Used by the seed_demo_data management command (shared demo accounts) and by
the per-visitor demo endpoint (one temporary account per visitor).

Idempotent: updates existing rows by deterministic key (email for users,
name+owner for projects). Never deletes user-created data.
"""
from dataclasses import dataclass

from django.contrib.auth.models import User
from django.utils import timezone

from api.models import (
    AITool,
    Checkpoint,
    Decision,
    Invitation,
    Notification,
    Project,
    UserProfile,
)
from api.services.checkpoint_generator import generate_checkpoints_for_use_case


DEMO_PASSWORD = 'TestPass123'

FACULTY_EMAIL = 'demo.faculty@usf.edu'
STUDENT_EMAIL = 'demo.student@usf.edu'

# Activity 1: faculty solo, shared as example
FACULTY_PUBLIC_ACTIVITY = {
    'name': 'Drafting feedback rubrics with AI for IS 6840',
    'description': (
        'Using ChatGPT to draft a feedback rubric for an undergraduate '
        'Information Systems assignment on database normalization. The rubric '
        'is reviewed by the instructor before use; student submissions never '
        'enter the AI tool.'
    ),
    'ai_use_case': 'teaching',
    'share_as_example': True,
    'risk_context': {
        'involves_student_data': False,
        'affects_decisions': False,
        'external_service': True,
    },
    'tools': ['ChatGPT'],
    'auto_complete_categories': {'Transparency', 'Documentation'},
}

# Activity 2: faculty + student collaborator
FACULTY_SHARED_ACTIVITY = {
    'name': 'Qualitative coding pilot — student perceptions of AI in coursework',
    'description': (
        'Using Claude to assist with thematic coding of de-identified student '
        'interview transcripts about generative AI in their coursework. All '
        'transcripts are de-identified by hand before any text reaches the AI '
        'tool. IRB approved as exempt.'
    ),
    'ai_use_case': 'qualitative',
    'share_as_example': False,
    'risk_context': {
        'involves_student_data': True,
        'human_subjects': True,
        'external_service': True,
    },
    'tools': ['Claude'],
    'auto_complete_categories': {'Transparency', 'Privacy', 'Documentation'},
}

# Activity 3: student-owned
STUDENT_ACTIVITY = {
    'name': 'AI-assisted literature review for CS senior project',
    'description': (
        'Using Perplexity to find peer-reviewed sources on transformer model '
        'interpretability for my senior project. Each citation is verified '
        'against the original paper before inclusion in my proposal.'
    ),
    'ai_use_case': 'literature',
    'share_as_example': False,
    'risk_context': {
        'involves_student_data': False,
        'affects_decisions': False,
        'external_service': True,
    },
    'tools': ['Perplexity'],
    'auto_complete_categories': {'Transparency'},
}

# The activities the shared faculty account owns. Per-visitor demo accounts
# get the same set.
FACULTY_ACTIVITY_SPECS = (FACULTY_PUBLIC_ACTIVITY, FACULTY_SHARED_ACTIVITY)


@dataclass(frozen=True)
class SharedDemoResult:
    faculty: User
    student: User
    public_activity: Project
    shared_activity: Project
    student_activity: Project


def ensure_user(email: str, *, first_name: str, last_name: str, role: str) -> User:
    """Create or refresh a shared demo user with the known demo password."""
    user, _ = User.objects.get_or_create(
        username=email,
        defaults={
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
        },
    )
    user.email = email
    user.first_name = first_name
    user.last_name = last_name
    user.set_password(DEMO_PASSWORD)
    user.save()
    UserProfile.objects.update_or_create(user=user, defaults={'role': role})
    return user


def ensure_project(
    *,
    owner: User,
    spec: dict,
    collaborator: User | None = None,
    share_as_example: bool | None = None,
) -> Project:
    """Create or refresh one demo activity from a spec.

    share_as_example overrides the spec's flag when given (per-visitor demo
    accounts never share their activities).
    """
    shared = spec['share_as_example'] if share_as_example is None else share_as_example
    project, _ = Project.objects.get_or_create(
        user=owner, name=spec['name'],
        defaults={
            'description': spec['description'],
            'ai_use_case': spec['ai_use_case'],
            'share_as_example': shared,
        },
    )
    project.description = spec['description']
    project.ai_use_case = spec['ai_use_case']
    project.share_as_example = shared
    project.student_collaborator = collaborator if collaborator and collaborator != owner else None
    project.save()

    tools = AITool.objects.filter(name__in=spec['tools'])
    if tools.exists():
        project.ai_tools.set(tools)

    _ensure_checkpoints(project, spec)
    _auto_complete(project, spec.get('auto_complete_categories', set()))
    return project


def _ensure_checkpoints(project: Project, spec: dict) -> None:
    expected = generate_checkpoints_for_use_case(project.ai_use_case, spec.get('risk_context', {}))
    existing_ids = set(project.checkpoints.values_list('checkpoint_id', flat=True))
    for cp_def in expected:
        if cp_def['checkpoint_id'] not in existing_ids:
            Checkpoint.objects.create(project=project, **cp_def)


def _auto_complete(project: Project, categories: set[str]) -> None:
    for cp in project.checkpoints.filter(category__in=categories, completed=False):
        cp.completed = True
        cp.completed_at = timezone.now()
        cp.save()
        Decision.objects.get_or_create(
            project=project, checkpoint=cp,
            description=f'Auto-attested for demo seed ({cp.label})',
            defaults={'notes': 'Seeded by seed_demo_data command.'},
        )


def ensure_pending_invitation(*, project: Project, from_user: User, to_email: str, role: str) -> Invitation:
    inv, _ = Invitation.objects.get_or_create(
        project=project,
        to_email=to_email,
        role=role,
        status=Invitation.STATUS_PENDING,
        defaults={
            'from_user': from_user,
            'note': 'Demo pending invite — accept or decline from the dashboard.',
        },
    )
    return inv


def _ensure_invite_notification(*, faculty: User, student: User, project: Project) -> None:
    if Notification.objects.filter(
        recipient=faculty, verb=Notification.VERB_INVITE_RECEIVED, project=project,
    ).exists():
        return
    Notification.objects.create(
        recipient=faculty,
        actor=student,
        verb=Notification.VERB_INVITE_RECEIVED,
        project=project,
        checkpoint=None,
        message=(
            f'{student.first_name} invited you to join '
            f'"{project.name}" as faculty advisor.'
        ),
    )


def seed_shared_demo_accounts() -> SharedDemoResult:
    """Create or refresh demo.faculty and demo.student with their scenarios."""
    faculty = ensure_user(FACULTY_EMAIL, first_name='Demo', last_name='Faculty', role='faculty')
    student = ensure_user(STUDENT_EMAIL, first_name='Demo', last_name='Student', role='student')

    public_activity = ensure_project(owner=faculty, spec=FACULTY_PUBLIC_ACTIVITY)
    shared_activity = ensure_project(owner=faculty, spec=FACULTY_SHARED_ACTIVITY, collaborator=student)
    student_activity = ensure_project(owner=student, spec=STUDENT_ACTIVITY)

    invite = ensure_pending_invitation(
        project=student_activity,
        from_user=student,
        to_email=FACULTY_EMAIL,
        role=Invitation.ROLE_FACULTY_ADVISOR,
    )
    invite.to_user = faculty
    invite.save(update_fields=['to_user'])
    _ensure_invite_notification(faculty=faculty, student=student, project=student_activity)

    return SharedDemoResult(
        faculty=faculty,
        student=student,
        public_activity=public_activity,
        shared_activity=shared_activity,
        student_activity=student_activity,
    )


def seed_visitor_activities(user: User) -> list[Project]:
    """Give a per-visitor demo account the shared faculty account's activities.

    No collaborators and no sharing: a visitor's data stays private to them.
    """
    return [
        ensure_project(owner=user, spec=spec, share_as_example=False)
        for spec in FACULTY_ACTIVITY_SPECS
    ]
