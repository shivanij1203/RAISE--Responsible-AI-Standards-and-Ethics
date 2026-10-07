"""Temporary per-visitor demo accounts.

Each "Try Demo" visitor gets their own faculty account on a reserved domain
(.invalid never resolves, so nothing can ever be delivered to it). Accounts
older than DEMO_ACCOUNT_TTL are deleted the next time someone starts a demo,
so cleanup needs no scheduled job.
"""
import uuid
from datetime import datetime, timedelta

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from api.models import UserProfile
from api.services.demo_seed import seed_visitor_activities

DEMO_EMAIL_DOMAIN = 'demo.raise.invalid'
DEMO_EMAIL_SUFFIX = f'@{DEMO_EMAIL_DOMAIN}'
DEMO_ACCOUNT_TTL = timedelta(hours=24)
DEMO_FIRST_NAME = 'Demo Professor'
DEMO_ROLE = 'faculty'


def is_demo_email(email: str | None) -> bool:
    return bool(email) and email.lower().endswith(DEMO_EMAIL_SUFFIX)


def is_demo_user(user: User | None) -> bool:
    """True for temporary per-visitor demo accounts (not the shared demo.faculty)."""
    return bool(user) and user.is_authenticated and is_demo_email(user.email)


def other_demo_owned(viewer: User, prefix: str = '') -> Q:
    """Match activities owned by demo accounts other than the viewer.

    Institution-wide views and counts exclude these, so each visitor's demo
    data stays private and never inflates real totals. `prefix` is the
    lookup path to the project, e.g. 'project__' for checkpoints.
    """
    return (
        Q(**{f'{prefix}user__email__iendswith': DEMO_EMAIL_SUFFIX})
        & ~Q(**{f'{prefix}user': viewer})
    )


def purge_expired_demo_users(now: datetime | None = None) -> int:
    """Delete demo users older than DEMO_ACCOUNT_TTL and everything they own.

    Deleting the user cascades to their profile, auth token, projects (and
    each project's checkpoints, decisions, comments, activity events,
    notifications, and invitations), their own comments, and notifications
    addressed to them. Returns the number of users deleted.
    """
    cutoff = (now or timezone.now()) - DEMO_ACCOUNT_TTL
    expired = User.objects.filter(
        email__iendswith=DEMO_EMAIL_SUFFIX, date_joined__lt=cutoff,
    )
    count = expired.count()
    if count:
        expired.delete()
    return count


@transaction.atomic
def create_demo_user() -> User:
    """Create a new demo faculty account seeded with the demo activities."""
    email = f'demo-{uuid.uuid4().hex[:12]}{DEMO_EMAIL_SUFFIX}'
    # No password argument: Django stores an unusable password, so this
    # account can only be reached through its token.
    user = User.objects.create_user(
        username=email, email=email, first_name=DEMO_FIRST_NAME,
    )
    UserProfile.objects.create(user=user, role=DEMO_ROLE)
    seed_visitor_activities(user)
    return user


# 403 messages for actions demo accounts cannot take. Each one would either
# expose a visitor's data to others or reach a real person.
DEMO_INVITE_BLOCKED = (
    "Demo accounts can't invite collaborators. "
    "Sign in with your own account to invite people."
)
DEMO_INVITE_RESPONSE_BLOCKED = "Demo accounts can't respond to invitations."
DEMO_COLLABORATOR_BLOCKED = (
    "Demo accounts can't add collaborators. "
    "Sign in with your own account to work with other people."
)
DEMO_SHARE_BLOCKED = "Demo activities can't be shared as examples in the Use Cases library."
DEMO_TOOL_EDIT_BLOCKED = (
    "Demo accounts can't add or edit tools in the shared registry. "
    "Sign in with your own account to make changes."
)
