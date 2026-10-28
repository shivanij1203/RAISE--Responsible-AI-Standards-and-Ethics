"""Public checklist preview for the landing page.

Reads one sentence and returns what RAISE would flag for it, using the same
parser and checklist rules as Quick Add. It stores nothing: no user, token,
project, or log row is created.
"""
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from api.models import AITool
from api.services.checkpoint_generator import generate_checkpoints_for_use_case
from api.services.quick_add_parser import USE_CASE_LABELS, parse_activity_description

PREVIEW_MAX_LENGTH = 300

# Same list as CRITICAL_CHECKPOINT_IDS in frontend/src/utils/risk.js.
HIGH_PRIORITY_IDS = frozenset({
    'irb', 'data_deidentified', 'participant_consent',
    'ferpa_compliance', 'grading_fairness', 'decision_impact',
})

RISK_FLAG_LABELS = {
    'involves_student_data': 'Student data',
    'data_leaves_institution': 'Data leaves your institution',
    'affects_decisions': 'Affects decisions about people',
    'involves_human_subjects': 'Human subjects',
}


class PreviewThrottle(AnonRateThrottle):
    """Per-IP limit. AnonRateThrottle keys on DRF's client IP (NUM_PROXIES aware)."""
    scope = 'preview'
    rate = '30/hour'


def build_preview(description: str) -> dict:
    tools = list(AITool.objects.values('id', 'name'))
    draft = parse_activity_description(description, tools)
    tool_names = {t['id']: t['name'] for t in tools}
    items = generate_checkpoints_for_use_case(draft['ai_use_case'], draft['risk_context'])
    return {
        'useCase': draft['ai_use_case'],
        'useCaseLabel': USE_CASE_LABELS.get(draft['ai_use_case'], draft['ai_use_case']),
        'tools': [tool_names[i] for i in draft['suggested_tool_ids'] if i in tool_names],
        'riskFlags': [
            {'key': key, 'label': RISK_FLAG_LABELS.get(key, key.replace('_', ' '))}
            for key, on in draft['risk_context'].items() if on
        ],
        'items': [
            {
                'id': item['checkpoint_id'],
                'label': item['label'],
                'tags': item['frameworks'],
                'highPriority': item['checkpoint_id'] in HIGH_PRIORITY_IDS,
            }
            for item in items
        ],
    }


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([PreviewThrottle])
def preview(request: Request) -> Response:
    """Return the checklist RAISE would suggest for one sentence. Saves nothing."""
    raw = request.data.get('description') if hasattr(request.data, 'get') else None
    if not isinstance(raw, str) or not raw.strip():
        return Response({'error': 'Write one sentence about how you use AI.'}, status=status.HTTP_400_BAD_REQUEST)
    description = raw.strip()
    if len(description) > PREVIEW_MAX_LENGTH:
        return Response(
            {'error': f'Keep it to {PREVIEW_MAX_LENGTH} characters or fewer.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response(build_preview(description))
