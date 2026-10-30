// Publishers a journal manuscript can follow. Keys match
// backend_django/api/services/journal_checklist.py (checked by test_rules.py).
export const PUBLISHERS = [
  { key: 'icmje', label: 'Journal that follows ICMJE' },
  { key: 'elsevier', label: 'Elsevier' },
  { key: 'springer_nature', label: 'Springer Nature / Nature' },
  { key: 'apa', label: 'APA' },
  { key: 'taylor_francis', label: 'Taylor & Francis' },
  { key: 'ieee', label: 'IEEE' },
  { key: 'other', label: 'Other journal' },
];
