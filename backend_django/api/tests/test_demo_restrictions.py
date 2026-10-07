"""What demo accounts can and cannot do, and who can see their activities."""
from django.contrib.auth.models import User
from django.test import Client, TestCase
from rest_framework.authtoken.models import Token

from api.models import Invitation, Notification, Project, UserProfile
from api.services.demo_accounts import (
    DEMO_COLLABORATOR_BLOCKED,
    DEMO_INVITE_BLOCKED,
    DEMO_INVITE_RESPONSE_BLOCKED,
    DEMO_SHARE_BLOCKED,
    create_demo_user,
)


def _client_for(user: User) -> Client:
    token, _ = Token.objects.get_or_create(user=user)
    return Client(HTTP_AUTHORIZATION=f'Token {token.key}')


def _real_user(email: str, role: str = 'faculty') -> User:
    user = User.objects.create_user(username=email, email=email, password='testpass123')
    UserProfile.objects.create(user=user, role=role)
    return user


class DemoBlockedActionsTest(TestCase):
    def setUp(self) -> None:
        self.demo = create_demo_user()
        self.client = _client_for(self.demo)
        self.project = Project.objects.filter(user=self.demo).first()
        self.real = _real_user('colleague@usf.edu')

    def _assert_forbidden(self, response, message: str) -> None:
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()['error'], message)

    def test_cannot_send_invitations(self) -> None:
        response = self.client.post(
            f'/api/projects/{self.project.id}/invitations',
            data={'email': 'colleague@usf.edu', 'role': 'faculty_advisor'},
            content_type='application/json',
        )

        self._assert_forbidden(response, DEMO_INVITE_BLOCKED)
        self.assertFalse(Invitation.objects.exists())
        self.assertFalse(Notification.objects.filter(recipient=self.real).exists())

    def test_cannot_create_a_shared_example(self) -> None:
        response = self.client.post(
            '/api/projects',
            data={'name': 'Shared', 'ai_use_case': 'teaching', 'share_as_example': True},
            content_type='application/json',
        )

        self._assert_forbidden(response, DEMO_SHARE_BLOCKED)
        self.assertFalse(Project.objects.filter(name='Shared').exists())

    def test_cannot_turn_on_share_as_example(self) -> None:
        response = self.client.put(
            f'/api/projects/{self.project.id}',
            data={'share_as_example': True},
            content_type='application/json',
        )

        self._assert_forbidden(response, DEMO_SHARE_BLOCKED)
        self.project.refresh_from_db()
        self.assertFalse(self.project.share_as_example)

    def test_can_send_share_as_example_false(self) -> None:
        response = self.client.put(
            f'/api/projects/{self.project.id}',
            data={'share_as_example': False, 'name': 'Renamed'},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)

    def test_cannot_attach_collaborators_on_create(self) -> None:
        response = self.client.post(
            '/api/projects',
            data={
                'name': 'With advisor', 'ai_use_case': 'teaching',
                'faculty_advisor_email': 'colleague@usf.edu',
            },
            content_type='application/json',
        )

        self._assert_forbidden(response, DEMO_COLLABORATOR_BLOCKED)

    def test_cannot_attach_collaborators_on_update(self) -> None:
        response = self.client.put(
            f'/api/projects/{self.project.id}',
            data={'student_collaborator_email': 'colleague@usf.edu'},
            content_type='application/json',
        )

        self._assert_forbidden(response, DEMO_COLLABORATOR_BLOCKED)
        self.project.refresh_from_db()
        self.assertIsNone(self.project.student_collaborator)

    def test_cannot_respond_to_invitations(self) -> None:
        real_project = Project.objects.create(user=self.real, name='Real work', ai_use_case='teaching')
        invite = Invitation.objects.create(
            project=real_project, from_user=self.real, to_email=self.demo.email,
            to_user=self.demo, role=Invitation.ROLE_STUDENT_COLLABORATOR,
        )

        for action in ('accept', 'decline'):
            response = self.client.post(f'/api/invitations/{invite.id}/{action}')
            self._assert_forbidden(response, DEMO_INVITE_RESPONSE_BLOCKED)

        invite.refresh_from_db()
        self.assertEqual(invite.status, Invitation.STATUS_PENDING)
        self.assertFalse(Notification.objects.filter(recipient=self.real).exists())

    def test_actions_never_notify_real_users(self) -> None:
        # Even if a real account ends up on a demo activity, it gets nothing.
        Project.objects.filter(id=self.project.id).update(student_collaborator=self.real)
        checkpoint = self.project.checkpoints.filter(completed=False).first()

        response = self.client.put(
            f'/api/projects/{self.project.id}/checkpoints/{checkpoint.checkpoint_id}',
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Notification.objects.filter(recipient=self.real).exists())


class DemoAllowedActionsTest(TestCase):
    def setUp(self) -> None:
        self.demo = create_demo_user()
        self.client = _client_for(self.demo)

    def test_can_create_edit_and_delete_own_activity(self) -> None:
        created = self.client.post(
            '/api/projects',
            data={'name': 'My draft', 'ai_use_case': 'teaching'},
            content_type='application/json',
        )
        self.assertEqual(created.status_code, 201)
        project_id = created.json()['id']

        edited = self.client.put(
            f'/api/projects/{project_id}',
            data={'name': 'My edited draft'},
            content_type='application/json',
        )
        self.assertEqual(edited.status_code, 200)
        self.assertEqual(Project.objects.get(id=project_id).name, 'My edited draft')

        deleted = self.client.delete(f'/api/projects/{project_id}')
        self.assertEqual(deleted.status_code, 204)
        self.assertFalse(Project.objects.filter(id=project_id).exists())


class DemoLibraryExclusionTest(TestCase):
    def setUp(self) -> None:
        self.demo = create_demo_user()
        self.demo_project = Project.objects.filter(user=self.demo).first()
        # Simulate a demo activity flagged as shared by any route.
        Project.objects.filter(id=self.demo_project.id).update(share_as_example=True)

        self.real = _real_user('real@usf.edu')
        self.real_project = Project.objects.create(
            user=self.real, name='Real shared example', ai_use_case='teaching',
            share_as_example=True,
        )

    def _library_ids(self, user: User) -> set[int]:
        body = _client_for(user).get('/api/activities/library').json()
        return {item['id'] for item in body['items']}

    def test_library_list_excludes_demo_activities_for_everyone(self) -> None:
        other_demo = create_demo_user()

        for viewer in (self.real, self.demo, other_demo):
            ids = self._library_ids(viewer)
            self.assertIn(self.real_project.id, ids)
            self.assertNotIn(self.demo_project.id, ids)

    def test_library_detail_hides_demo_activities(self) -> None:
        response = _client_for(self.real).get(f'/api/activities/library/{self.demo_project.id}')

        self.assertEqual(response.status_code, 404)


class DemoIsolationTest(TestCase):
    def setUp(self) -> None:
        self.alice = create_demo_user()
        self.bob = create_demo_user()
        self.alice_ids = set(Project.objects.filter(user=self.alice).values_list('id', flat=True))
        self.bob_ids = set(Project.objects.filter(user=self.bob).values_list('id', flat=True))

    def test_activity_lists_are_separate(self) -> None:
        alice_list = {p['id'] for p in _client_for(self.alice).get('/api/projects').json()}
        bob_list = {p['id'] for p in _client_for(self.bob).get('/api/projects').json()}

        self.assertEqual({int(i) for i in alice_list}, self.alice_ids)
        self.assertEqual({int(i) for i in bob_list}, self.bob_ids)

    def test_cannot_open_or_change_another_visitors_activity(self) -> None:
        bob_project = next(iter(self.bob_ids))
        alice = _client_for(self.alice)

        self.assertEqual(alice.get(f'/api/projects/{bob_project}').status_code, 404)
        self.assertEqual(
            alice.put(
                f'/api/projects/{bob_project}', data={'name': 'x'},
                content_type='application/json',
            ).status_code,
            404,
        )
        self.assertEqual(alice.delete(f'/api/projects/{bob_project}').status_code, 404)

    def test_department_dashboard_hides_other_visitors(self) -> None:
        body = _client_for(self.alice).get('/api/dashboard/stats?scope=all').json()
        ids = {int(a['id']) for a in body['activities']}

        self.assertTrue(self.alice_ids <= ids)
        self.assertFalse(self.bob_ids & ids)

    def test_real_faculty_department_dashboard_hides_demo_activities(self) -> None:
        real = _real_user('dean@usf.edu')

        body = _client_for(real).get('/api/dashboard/stats?scope=all').json()
        ids = {int(a['id']) for a in body['activities']}

        self.assertFalse((self.alice_ids | self.bob_ids) & ids)
