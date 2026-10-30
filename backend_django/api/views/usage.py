"""Anonymous usage counts for actions that happen only in the browser."""
from rest_framework import status
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from api.services.usage import CLIENT_EVENTS, record_usage


class UsageThrottle(UserRateThrottle):
    scope = 'usage'
    rate = '120/hour'


@api_view(['POST'])
@throttle_classes([UsageThrottle])
def usage_event(request: Request) -> Response:
    """Count one copy or export. Stores no user, text, or exact time."""
    if not request.user.is_authenticated:
        return Response({'error': 'Not logged in'}, status=status.HTTP_401_UNAUTHORIZED)
    event = request.data.get('event') if hasattr(request.data, 'get') else None
    if event not in CLIENT_EVENTS:
        return Response(
            {'error': f"Unknown event. Must be one of: {', '.join(sorted(CLIENT_EVENTS))}"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    record_usage(event, user=request.user, use_case=request.data.get('use_case'))
    return Response(status=status.HTTP_204_NO_CONTENT)
