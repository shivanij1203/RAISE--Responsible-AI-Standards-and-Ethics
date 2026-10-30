"""Shape shared by the checklist items that are built on verified rules."""
from dataclasses import dataclass
from typing import Any

# A checklist item is either something to check and record ('check'), or
# information the person should know that needs no action ('info').
CHECK = 'check'
INFO = 'info'


@dataclass(frozen=True)
class RuleItem:
    checkpoint_id: str
    label: str
    category: str
    what: str
    why: str
    how: str
    # Rule IDs from api.rules, shown as the item's sources.
    rules: tuple[str, ...]
    # Short tags shown as badges, e.g. ('NIH',).
    frameworks: tuple[str, ...]
    kind: str = CHECK
    high_priority: bool = False

    def as_checkpoint(self) -> dict[str, Any]:
        """The fields a Checkpoint row stores."""
        return {
            'checkpoint_id': self.checkpoint_id,
            'label': self.label,
            'category': self.category,
            'assigned_to': 'pi',
            'what': self.what,
            'why': self.why,
            'how': self.how,
            'frameworks': list(self.frameworks),
        }
