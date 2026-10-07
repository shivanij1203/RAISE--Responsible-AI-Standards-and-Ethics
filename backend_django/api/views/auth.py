from rest_framework.decorators import api_view, authentication_classes, throttle_classes
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.throttling import AnonRateThrottle, BaseThrottle
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.core.cache import cache

from api.models import UserProfile
from api.services.demo_accounts import create_demo_user, is_demo_user, purge_expired_demo_users


def user_payload(user: User, role: str) -> dict:
    """The user object returned by login, register, demo start, and /auth/me."""
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.first_name,
        "role": role,
        "is_demo": is_demo_user(user),
    }


def client_ip(request: Request) -> str:
    """The client IP DRF throttles use: the last X-Forwarded-For entry behind
    Render's proxy (NUM_PROXIES = 1), else REMOTE_ADDR."""
    return BaseThrottle().get_ident(request)


class DemoStartThrottle(AnonRateThrottle):
    """Limit demo account creation per IP so the endpoint cannot be spammed."""
    scope = 'demo_start'
    rate = '20/hour'


@api_view(['POST'])
def register(request: Request) -> Response:
    """Register a new user."""
    email = request.data.get('email')
    password = request.data.get('password')
    full_name = request.data.get('full_name', '')
    role = request.data.get('role', 'student')

    if not email or not password:
        return Response(
            {"error": "Email and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not email.lower().endswith('@usf.edu'):
        return Response(
            {"error": "Registration is restricted to USF email addresses (@usf.edu)."},
            status=status.HTTP_400_BAD_REQUEST
        )

    valid_roles = ['student', 'faculty', 'admin']
    if role not in valid_roles:
        return Response(
            {"error": f"Role must be one of: {', '.join(valid_roles)}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=email).exists():
        return Response(
            {"error": "An account with this email already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(password) < 8:
        return Response(
            {"error": "Password must be at least 8 characters"},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=full_name
    )
    UserProfile.objects.create(user=user, role=role)

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        "message": "Account created",
        "token": token.key,
        "user": user_payload(user, role),
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login_view(request: Request) -> Response:
    """Login with email and password."""
    email = request.data.get('email')
    password = request.data.get('password')

    # Rate limit: 5 failed attempts per IP per 15 minutes
    ip = client_ip(request)
    cache_key = f'login_attempts_{ip}'
    attempts = cache.get(cache_key, 0)
    if attempts >= 5:
        return Response(
            {"error": "Too many failed login attempts. Please wait 15 minutes."},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )

    user = authenticate(username=email, password=password)
    if not user:
        cache.set(cache_key, attempts + 1, timeout=900)  # 15 min
        return Response(
            {"error": "Invalid email or password"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Clear failed attempts on successful login
    cache.delete(cache_key)

    login(request, user)
    profile, _ = UserProfile.objects.get_or_create(
        user=user, defaults={'role': 'student'}
    )
    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        "message": "Logged in",
        "token": token.key,
        "user": user_payload(user, profile.role),
    })


@api_view(['POST'])
@authentication_classes([])
@throttle_classes([DemoStartThrottle])
def demo_start(request: Request) -> Response:
    """Create a temporary demo account for this visitor and sign them in.

    Expired demo accounts are purged first, so cleanup happens without a
    scheduled job. Returns the same payload shape as login_view.
    """
    purge_expired_demo_users()
    user = create_demo_user()
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        "message": "Demo session started",
        "token": token.key,
        "user": user_payload(user, user.profile.role),
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def logout_view(request: Request) -> Response:
    """Logout: revoke the auth token and clear the session."""
    if request.user.is_authenticated:
        Token.objects.filter(user=request.user).delete()
    logout(request)
    return Response({"message": "Logged out"})


@api_view(['GET'])
def me(request: Request) -> Response:
    """Get current user info."""
    if not request.user.is_authenticated:
        return Response(
            {"error": "Not logged in"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={'role': 'student'}
    )

    return Response(user_payload(request.user, profile.role))
