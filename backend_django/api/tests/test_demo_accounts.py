"""Per-visitor demo accounts: creation, seeding, cleanup, throttling, payloads."""
from datetime import timedelta
from unittest import mock

from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.management import call_command
from django.test import Client, TestCase
from django.utils import timezone
from rest_framework.authtoken.models import Token

from api.models import (
    ActivityEvent,
    Checkpoint,
    CheckpointComment,
    Decision,
    Notification,
    Project,
    UserProfile,
)
from api.services.demo_accounts import (
    DEMO_EMAIL_SUFFIX,
    create_demo_user,
    purge_expired_demo_users,
)
from api.services.demo_seed import (
    DEMO_PASSWORD,
    FACULTY_ACTIVITY_SPECS,
    FACULTY_EMAIL,
)

DEMO_URL = '/api/auth/demo'


def _start_demo(client: Client, forwarded_for: str | None = None):
    extra = {'HTTP_X_FORWARDED_FOR': forwarded_for} if forwarded_for else {}
    return client.post(DEMO_URL, content_type='application/json', **extra)


def _make_unseeded_demo_user() -> User:
    """Stand-in for create_demo_user that skips seeding, for throttle tests."""
    email = f'demo-{User.objects.count()}{DEMO_EMAIL_SUFFIX}'
    user = User.objects.create_user(username=email, email=email)
    UserProfile.objects.create(user=user, role='faculty')
    return user


class DemoStartEndpointTest(TestCase):
    def setUp(self) -> None:
        cache.clear()
        self.client = Client()

    def test_creates_demo_faculty_user(self) -> None:
        response = _start_demo(self.client)

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(id=response.json()['user']['id'])
        self.assertTrue(user.email.startswith('demo-'))
        self.assertTrue(user.email.endswith(DEMO_EMAIL_SUFFIX))
        self.assertEqual(user.username, user.email)
        self.assertEqual(user.first_name, 'Demo Professor')
        self.assertEqual(user.profile.role, 'faculty')
        self.assertFalse(user.has_usable_password())

    def test_payload_matches_login_shape(self) -> None:
        body = _start_demo(self.client).json()

        self.assertEqual(set(body), {'message', 'token', 'user'})
        self.assertEqual(
            set(body['user']), {'id', 'email', 'full_name', 'role', 'is_demo'},
        )
        self.assertTrue(body['user']['is_demo'])
        self.assertEqual(body['user']['full_name'], 'Demo Professor')
        user = User.objects.get(id=body['user']['id'])
        self.assertEqual(Token.objects.get(user=user).key, body['token'])

    def test_token_signs_the_visitor_in(self) -> None:
        token = _start_demo(self.client).json()['token']

        me = self.client.get('/api/auth/me', HTTP_AUTHORIZATION=f'Token {token}')

        self.assertEqual(me.status_code, 200)
        self.assertTrue(me.json()['is_demo'])

    def test_each_call_creates_a_separate_user(self) -> None:
        first = _start_demo(self.client).json()['user']['id']
        second = _start_demo(self.client).json()['user']['id']

        self.assertNotEqual(first, second)

    def test_ignores_a_stale_token_header(self) -> None:
        response = self.client.post(
            DEMO_URL, content_type='application/json',
            HTTP_AUTHORIZATION='Token not-a-real-token',
        )

        self.assertEqual(response.status_code, 201)

    @mock.patch('api.views.auth.create_demo_user', side_effect=_make_unseeded_demo_user)
    def test_throttled_after_twenty_per_hour(self, _fake_create) -> None:
        statuses = [_start_demo(self.client).status_code for _ in range(21)]

        self.assertEqual(statuses[:20], [201] * 20)
        self.assertEqual(statuses[20], 429)

    @mock.patch('api.views.auth.create_demo_user', side_effect=_make_unseeded_demo_user)
    def test_throttle_uses_the_ip_render_appends(self, _fake_create) -> None:
        # Render's proxy appends the real client IP last. Changing the
        # client-supplied entries in front of it must not reset the limit.
        statuses = [
            _start_demo(self.client, forwarded_for=f'10.0.0.{n}, 203.0.113.5').status_code
            for n in range(21)
        ]

        self.assertEqual(statuses[:20], [201] * 20)
        self.assertEqual(statuses[20], 429)

    @mock.patch('api.views.auth.create_demo_user', side_effect=_make_unseeded_demo_user)
    def test_clients_behind_the_proxy_have_separate_limits(self, _fake_create) -> None:
        for _ in range(20):
            _start_demo(self.client, forwarded_for='203.0.113.5')

        blocked = _start_demo(self.client, forwarded_for='203.0.113.5')
        other_client = _start_demo(self.client, forwarded_for='198.51.100.7')

        self.assertEqual(blocked.status_code, 429)
        self.assertEqual(other_client.status_code, 201)


class DemoSeedingTest(TestCase):
    def test_demo_user_gets_the_shared_faculty_activities(self) -> None:
        user = create_demo_user()

        names = set(Project.objects.filter(user=user).values_list('name', flat=True))
        self.assertEqual(names, {spec['name'] for spec in FACULTY_ACTIVITY_SPECS})

    def test_demo_activities_are_private_and_solo(self) -> None:
        user = create_demo_user()

        for project in Project.objects.filter(user=user):
            self.assertFalse(project.share_as_example)
            self.assertIsNone(project.student_collaborator)
            self.assertIsNone(project.faculty_advisor)
            self.assertTrue(project.checkpoints.exists())
            self.assertTrue(project.checkpoints.filter(completed=True).exists())

    def test_reseeding_renames_an_activity_instead_of_duplicating_it(self) -> None:
        from api.services.demo_seed import FACULTY_SHARED_ACTIVITY
        call_command('seed_demo_data', stdout=mock.MagicMock())
        faculty = User.objects.get(email=FACULTY_EMAIL)
        old_name = FACULTY_SHARED_ACTIVITY['previous_names'][0]
        Project.objects.filter(user=faculty, name=FACULTY_SHARED_ACTIVITY['name']).update(name=old_name)

        call_command('seed_demo_data', stdout=mock.MagicMock())

        names = list(Project.objects.filter(user=faculty).values_list('name', flat=True))
        self.assertIn(FACULTY_SHARED_ACTIVITY['name'], names)
        self.assertNotIn(old_name, names)
        self.assertEqual(len(names), 2)

    def test_demo_text_has_no_em_dashes(self) -> None:
        from api.services import demo_seed
        for spec in (demo_seed.FACULTY_PUBLIC_ACTIVITY, demo_seed.FACULTY_SHARED_ACTIVITY, demo_seed.STUDENT_ACTIVITY):
            self.assertNotIn('\u2014', spec['name'] + spec['description'])

    def test_demo_activities_have_a_category(self) -> None:
        user = create_demo_user()

        categories = dict(Project.objects.filter(user=user).values_list('name', 'category'))
        self.assertTrue(all(categories.values()), categories)

    def test_seed_command_keeps_shared_demo_accounts_working(self) -> None:
        call_command('seed_demo_data', stdout=mock.MagicMock())
        call_command('seed_demo_data', stdout=mock.MagicMock())  # idempotent

        response = Client().post(
            '/api/auth/login',
            data={'email': FACULTY_EMAIL, 'password': DEMO_PASSWORD},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['user']['is_demo'])
        faculty = User.objects.get(email=FACULTY_EMAIL)
        self.assertEqual(Project.objects.filter(user=faculty).count(), 2)
        self.assertTrue(Project.objects.filter(user=faculty, share_as_example=True).exists())


class DemoCleanupTest(TestCase):
    def setUp(self) -> None:
        cache.clear()

    def _age(self, user: User, hours: int) -> None:
        User.objects.filter(id=user.id).update(
            date_joined=timezone.now() - timedelta(hours=hours),
        )

    def _add_activity_records(self, user: User) -> Project:
        project = Project.objects.filter(user=user).first()
        checkpoint = project.checkpoints.first()
        CheckpointComment.objects.create(checkpoint=checkpoint, user=user, text='note')
        ActivityEvent.objects.create(
            project=project, actor=user,
            event_type=ActivityEvent.EVENT_ACTIVITY_CREATED, summary='created',
        )
        Notification.objects.create(
            recipient=user, actor=user, verb=Notification.VERB_COMMENT_ADDED,
            project=project, message='hello',
        )
        Token.objects.get_or_create(user=user)
        return project

    def test_deletes_demo_users_older_than_24_hours_with_their_data(self) -> None:
        old = create_demo_user()
        project = self._add_activity_records(old)
        self._age(old, hours=25)

        deleted = purge_expired_demo_users()

        self.assertEqual(deleted, 1)
        self.assertFalse(User.objects.filter(id=old.id).exists())
        self.assertFalse(Project.objects.filter(user_id=old.id).exists())
        self.assertFalse(Checkpoint.objects.filter(project_id=project.id).exists())
        self.assertFalse(Decision.objects.filter(project_id=project.id).exists())
        self.assertFalse(CheckpointComment.objects.filter(user_id=old.id).exists())
        self.assertFalse(ActivityEvent.objects.filter(project_id=project.id).exists())
        self.assertFalse(Notification.objects.filter(recipient_id=old.id).exists())
        self.assertFalse(Token.objects.filter(user_id=old.id).exists())
        self.assertFalse(UserProfile.objects.filter(user_id=old.id).exists())

    def test_keeps_recent_demo_users(self) -> None:
        recent = create_demo_user()
        self._age(recent, hours=23)

        purge_expired_demo_users()

        self.assertTrue(User.objects.filter(id=recent.id).exists())

    def test_never_deletes_real_or_shared_demo_accounts(self) -> None:
        real = User.objects.create_user(username='prof@usf.edu', email='prof@usf.edu', password='x' * 12)
        call_command('seed_demo_data', stdout=mock.MagicMock())
        User.objects.update(date_joined=timezone.now() - timedelta(days=30))

        purge_expired_demo_users()

        self.assertTrue(User.objects.filter(id=real.id).exists())
        self.assertTrue(User.objects.filter(email=FACULTY_EMAIL).exists())

    def test_demo_start_runs_cleanup(self) -> None:
        old = create_demo_user()
        self._age(old, hours=48)

        _start_demo(Client())

        self.assertFalse(User.objects.filter(id=old.id).exists())


class IsDemoFlagTest(TestCase):
    def test_real_user_is_not_demo(self) -> None:
        User.objects.create_user(username='real@usf.edu', email='real@usf.edu', password='testpass123')
        client = Client()

        login = client.post(
            '/api/auth/login',
            data={'email': 'real@usf.edu', 'password': 'testpass123'},
            content_type='application/json',
        )
        token = login.json()['token']
        me = client.get('/api/auth/me', HTTP_AUTHORIZATION=f'Token {token}')

        self.assertFalse(login.json()['user']['is_demo'])
        self.assertFalse(me.json()['is_demo'])
