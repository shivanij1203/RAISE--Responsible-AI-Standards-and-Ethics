from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.core.cache import cache

from api.models import UserProfile


class RegisterViewTest(TestCase):
    """Tests for the /api/auth/register endpoint."""

    def setUp(self) -> None:
        self.client = Client()

    def test_register_success(self) -> None:
        response = self.client.post(
            '/api/auth/register',
            data={
                'email': 'test@usf.edu',
                'password': 'securepass123',
                'full_name': 'Test User',
                'role': 'student',
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(username='test@usf.edu').exists())

    def test_register_rejects_non_usf_email(self) -> None:
        response = self.client.post(
            '/api/auth/register',
            data={
                'email': 'test@gmail.com',
                'password': 'securepass123',
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)

    def test_register_rejects_short_password(self) -> None:
        response = self.client.post(
            '/api/auth/register',
            data={
                'email': 'test@usf.edu',
                'password': 'short',
            },
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)


class LoginViewTest(TestCase):
    """Tests for the /api/auth/login endpoint."""

    def setUp(self) -> None:
        self.client = Client()
        self.user = User.objects.create_user(
            username='login@usf.edu',
            email='login@usf.edu',
            password='testpass123',
            first_name='Login User',
        )
        UserProfile.objects.create(user=self.user, role='student')

    def test_login_success(self) -> None:
        response = self.client.post(
            '/api/auth/login',
            data={'email': 'login@usf.edu', 'password': 'testpass123'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['user']['email'], 'login@usf.edu')

    def test_login_invalid_credentials(self) -> None:
        response = self.client.post(
            '/api/auth/login',
            data={'email': 'login@usf.edu', 'password': 'wrongpass'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 401)

    def test_login_returns_token(self) -> None:
        """Login must return an auth token for header-based requests."""
        response = self.client.post(
            '/api/auth/login',
            data={'email': 'login@usf.edu', 'password': 'testpass123'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json().get('token'))


class TokenAuthTest(TestCase):
    """The auth token alone must authenticate API requests (no cookie)."""

    def setUp(self) -> None:
        self.client = Client()
        self.user = User.objects.create_user(
            username='token@usf.edu',
            email='token@usf.edu',
            password='testpass123',
            first_name='Token User',
        )
        UserProfile.objects.create(user=self.user, role='faculty')

    def test_token_authenticates_request(self) -> None:
        login = self.client.post(
            '/api/auth/login',
            data={'email': 'token@usf.edu', 'password': 'testpass123'},
            content_type='application/json',
        )
        token = login.json()['token']

        # A fresh client with no session cookie, token in the header only.
        fresh = Client()
        response = fresh.get('/api/auth/me', HTTP_AUTHORIZATION=f'Token {token}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['email'], 'token@usf.edu')

    def test_invalid_token_rejected(self) -> None:
        fresh = Client()
        response = fresh.get('/api/auth/me', HTTP_AUTHORIZATION='Token notarealtoken')
        self.assertEqual(response.status_code, 401)


class MeViewTest(TestCase):
    """Tests for the /api/auth/me endpoint."""

    def setUp(self) -> None:
        self.client = Client()
        self.user = User.objects.create_user(
            username='me@usf.edu',
            email='me@usf.edu',
            password='testpass123',
            first_name='Me User',
        )
        UserProfile.objects.create(user=self.user, role='faculty')

    def test_me_authenticated(self) -> None:
        self.client.login(username='me@usf.edu', password='testpass123')
        response = self.client.get('/api/auth/me')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['role'], 'faculty')

    def test_me_unauthenticated(self) -> None:
        response = self.client.get('/api/auth/me')
        self.assertEqual(response.status_code, 401)


class LoginRateLimitTest(TestCase):
    """Five failed sign-ins per client IP, using the IP Render's proxy reports."""

    def setUp(self) -> None:
        cache.clear()
        self.client = Client()
        User.objects.create_user(
            username='limit@usf.edu', email='limit@usf.edu', password='testpass123',
        )

    def _login(self, password: str, forwarded_for: str | None = None):
        extra = {'HTTP_X_FORWARDED_FOR': forwarded_for} if forwarded_for else {}
        return self.client.post(
            '/api/auth/login',
            data={'email': 'limit@usf.edu', 'password': password},
            content_type='application/json',
            **extra,
        )

    def test_blocks_after_five_failures(self) -> None:
        statuses = [self._login('wrong').status_code for _ in range(6)]

        self.assertEqual(statuses[:5], [401] * 5)
        self.assertEqual(statuses[5], 429)

    def test_limit_uses_the_ip_render_appends(self) -> None:
        # Render's proxy appends the real client IP last. Changing the
        # client-supplied entries in front of it must not reset the limit.
        for n in range(5):
            self._login('wrong', forwarded_for=f'10.0.0.{n}, 203.0.113.5')

        blocked = self._login('testpass123', forwarded_for='10.0.0.99, 203.0.113.5')

        self.assertEqual(blocked.status_code, 429)

    def test_clients_behind_the_proxy_have_separate_limits(self) -> None:
        for _ in range(5):
            self._login('wrong', forwarded_for='203.0.113.5')

        blocked = self._login('testpass123', forwarded_for='203.0.113.5')
        other_client = self._login('testpass123', forwarded_for='198.51.100.7')

        self.assertEqual(blocked.status_code, 429)
        self.assertEqual(other_client.status_code, 200)


class LogoutRevokesTokenTest(TestCase):
    """Signing out deletes the token on the server, so a saved copy stops working."""

    def setUp(self) -> None:
        cache.clear()
        user = User.objects.create_user(username='out@usf.edu', email='out@usf.edu', password='securepass123')
        UserProfile.objects.create(user=user, role='faculty')

    def _token(self) -> str:
        response = Client().post('/api/auth/login', data={'email': 'out@usf.edu', 'password': 'securepass123'},
                                 content_type='application/json')
        return response.json()['token']

    def test_token_stops_working_after_logout(self) -> None:
        token = self._token()
        client = Client(HTTP_AUTHORIZATION=f'Token {token}')
        self.assertEqual(client.get('/api/auth/me').status_code, 200)

        self.assertEqual(client.post('/api/auth/logout').status_code, 200)

        reused = Client(HTTP_AUTHORIZATION=f'Token {token}')
        self.assertEqual(reused.get('/api/auth/me').status_code, 401)

    def test_demo_token_stops_working_after_end_demo(self) -> None:
        token = Client().post('/api/auth/demo').json()['token']
        client = Client(HTTP_AUTHORIZATION=f'Token {token}')

        client.post('/api/auth/logout')

        self.assertEqual(Client(HTTP_AUTHORIZATION=f'Token {token}').get('/api/auth/me').status_code, 401)
