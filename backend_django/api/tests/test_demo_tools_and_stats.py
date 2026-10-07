"""Demo accounts and the shared tool registry, plus institution-wide stats."""
from django.contrib.auth.models import User
from django.test import Client, TestCase
from rest_framework.authtoken.models import Token

from api.models import AITool, Checkpoint, Project, UserProfile
from api.services.demo_accounts import DEMO_TOOL_EDIT_BLOCKED, create_demo_user


def _client_for(user: User) -> Client:
    token, _ = Token.objects.get_or_create(user=user)
    return Client(HTTP_AUTHORIZATION=f'Token {token.key}')


def _real_faculty(email: str) -> User:
    user = User.objects.create_user(username=email, email=email, password='testpass123')
    UserProfile.objects.create(user=user, role='faculty')
    return user


class DemoToolRegistryTest(TestCase):
    def setUp(self) -> None:
        self.demo = create_demo_user()
        self.client = _client_for(self.demo)
        self.tool = AITool.objects.create(name='ChatGPT', category='writing')

    def test_cannot_add_a_tool(self) -> None:
        response = self.client.post(
            '/api/tools',
            data={'name': 'Visitor tool', 'category': 'writing'},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()['error'], DEMO_TOOL_EDIT_BLOCKED)
        self.assertFalse(AITool.objects.filter(name='Visitor tool').exists())

    def test_cannot_edit_a_tool(self) -> None:
        response = self.client.put(
            f'/api/tools/{self.tool.id}',
            data={'name': 'Renamed by visitor'},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()['error'], DEMO_TOOL_EDIT_BLOCKED)
        self.tool.refresh_from_db()
        self.assertEqual(self.tool.name, 'ChatGPT')

    def test_can_still_browse_tools(self) -> None:
        self.assertEqual(self.client.get('/api/tools').status_code, 200)
        self.assertEqual(self.client.get(f'/api/tools/{self.tool.id}/detail').status_code, 200)

    def test_real_faculty_can_still_add_tools(self) -> None:
        response = _client_for(_real_faculty('prof@usf.edu')).post(
            '/api/tools',
            data={'name': 'Real tool', 'category': 'writing'},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)


class DemoStatsExclusionTest(TestCase):
    """Other visitors' demo activities never count in institution-wide views."""

    def setUp(self) -> None:
        self.tool = AITool.objects.create(name='Claude', category='writing')
        self.real = _real_faculty('prof@usf.edu')
        self.real_project = Project.objects.create(
            user=self.real, name='Real activity', ai_use_case='teaching',
        )
        self.real_project.ai_tools.add(self.tool)
        Checkpoint.objects.create(
            project=self.real_project, checkpoint_id='irb', label='IRB',
            category='Regulatory', assigned_to='pi', completed=True,
        )

        self.demo = create_demo_user()
        self.other_demo = create_demo_user()
        for user in (self.demo, self.other_demo):
            for project in Project.objects.filter(user=user):
                project.ai_tools.add(self.tool)

    def _insights(self, viewer: User) -> dict:
        return _client_for(viewer).get('/api/tools/insights').json()

    def test_tool_insights_for_real_users_ignore_demo_activities(self) -> None:
        body = self._insights(self.real)

        self.assertEqual(body['totalActivities'], 1)
        self.assertEqual(body['totalCheckpoints'], 1)
        self.assertEqual(body['completedCheckpoints'], 1)
        self.assertEqual(body['topTools'][0]['activityCount'], 1)
        self.assertEqual(body['topUseCases'], [{'useCase': 'teaching', 'count': 1}])

    def test_tool_insights_for_a_visitor_count_only_their_own_demo_data(self) -> None:
        own = Project.objects.filter(user=self.demo)
        own_checkpoints = Checkpoint.objects.filter(project__user=self.demo).count()

        body = self._insights(self.demo)

        self.assertEqual(body['totalActivities'], 1 + own.count())
        self.assertEqual(body['totalCheckpoints'], 1 + own_checkpoints)
        self.assertEqual(body['topTools'][0]['activityCount'], 1 + own.count())

    def test_tool_detail_history_hides_other_visitors(self) -> None:
        names_seen_by_demo = {
            a['id'] for a in
            _client_for(self.demo).get(f'/api/tools/{self.tool.id}/detail').json()['activityHistory']
        }
        own_ids = {str(i) for i in Project.objects.filter(user=self.demo).values_list('id', flat=True)}
        other_ids = {str(i) for i in Project.objects.filter(user=self.other_demo).values_list('id', flat=True)}

        self.assertEqual(names_seen_by_demo, own_ids | {str(self.real_project.id)})
        self.assertFalse(names_seen_by_demo & other_ids)

    def test_dashboard_tool_usage_ignores_demo_activities(self) -> None:
        body = _client_for(self.real).get('/api/dashboard/stats?scope=all').json()

        self.assertEqual(body['toolStats']['mostUsed'][0]['count'], 1)
