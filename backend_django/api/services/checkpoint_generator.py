"""Checkpoint generation logic: the checklist items suggested for each kind of AI use.

Moved from views.py to keep views thin. Contains:
- FRAMEWORK_MAP: maps checkpoint IDs to applicable regulatory frameworks
- generate_checkpoints_for_use_case(): returns the right set of checkpoints
  for a given AI use case
"""
from typing import Any

from api.rules import citations
from api.rules.frameworks import OFFICIAL_SOURCES, framework_source
from api.services.journal_checklist import JOURNAL_ITEM_IDS, journal_item, journal_items
from api.services.quick_add_parser import detect_rule_context
from api.services.research_checklists import ALL_RESEARCH_ITEMS, grant_items, review_items
from api.services.rule_items import CHECK, RuleItem

# Use cases whose checklist is built on verified funder and journal rules.
GRANT_PROPOSAL = 'grant_proposal'
PEER_REVIEW = 'peer_review'
JOURNAL_MANUSCRIPT = 'journal_manuscript'
RULE_USE_CASES = {GRANT_PROPOSAL, PEER_REVIEW, JOURNAL_MANUSCRIPT}

_RESEARCH_ITEMS_BY_ID: dict[str, RuleItem] = {item.checkpoint_id: item for item in ALL_RESEARCH_ITEMS}

# Items shown as high priority. The frontend reads the highPriority flag the
# API sends; frontend/src/utils/risk.js keeps the first six as a fallback.
HIGH_PRIORITY_IDS: frozenset[str] = frozenset({
    'irb', 'data_deidentified', 'participant_consent',
    'ferpa_compliance', 'grading_fairness', 'decision_impact',
    *(item.checkpoint_id for item in ALL_RESEARCH_ITEMS if item.high_priority),
})

# ============== Framework Mapping ==============

# Official sources for framework tags live in api.rules.frameworks: four
# tags have a vetted link, the rest are plain labels.
SOURCE_URLS: dict[str, str] = {tag: src.url for tag, src in OFFICIAL_SOURCES.items()}


def sources_for(frameworks: list[str] | None) -> list[dict[str, str | None]]:
    """Framework tags as {name, url, version, lastChecked}.

    url is None for plain labels; version and lastChecked are None unless the
    official page was opened and checked.
    """
    return [framework_source(name).as_dict() for name in (frameworks or [])]


def rule_item_for(checkpoint_id: str, publisher: str | None = None) -> RuleItem | None:
    """The rule-based item behind a checkpoint, worded for the publisher; None for other items."""
    if checkpoint_id in JOURNAL_ITEM_IDS:
        return journal_item(checkpoint_id, publisher)
    return _RESEARCH_ITEMS_BY_ID.get(checkpoint_id)


def item_sources(checkpoint_id: str, frameworks: list[str] | None, publisher: str | None = None) -> dict[str, Any]:
    """Sources and flags for one checklist item.

    Rule-based items cite each rule's page (with its date and the date RAISE
    checked it) and the quoted words. Other items keep their framework tags.
    """
    item = rule_item_for(checkpoint_id, publisher)
    high_priority = checkpoint_id in HIGH_PRIORITY_IDS
    if item is None:
        return {'sources': sources_for(frameworks), 'quotes': [], 'kind': CHECK, 'highPriority': high_priority}
    quotes = citations(item.rules)
    pages: dict[str, dict[str, str | None]] = {}
    for q in quotes:
        pages.setdefault(q['url'], {k: v for k, v in q.items() if k != 'quote'})
    return {'sources': list(pages.values()), 'quotes': quotes, 'kind': item.kind, 'highPriority': high_priority}


FRAMEWORK_MAP: dict[str, list[str]] = {
    'irb': ['IRB', 'Common Rule'],
    'data_classification': ['NIST AI RMF', 'Institutional Policy'],
    'ai_disclosure': ['Transparency', 'Journal Policy'],
    'data_deidentified': ['HIPAA', 'FERPA', 'NIST AI RMF'],
    'data_storage': ['NIST AI RMF', 'Institutional Policy'],
    'bias_audit': ['NIST AI RMF', 'Fairness'],
    'human_review': ['NIST AI RMF', 'Accountability'],
    'ai_coding_disclosure': ['Transparency', 'Journal Policy'],
    'participant_consent': ['IRB', 'Common Rule', 'FERPA'],
    'ai_writing_disclosure': ['Transparency', 'Journal Policy'],
    'grading_fairness': ['FERPA', 'Fairness', 'Institutional Policy'],
    'ferpa_compliance': ['FERPA'],
    'grading_transparency': ['FERPA', 'Transparency', 'Institutional Policy'],
    'human_override': ['FERPA', 'Accountability'],
    'grading_validation': ['NIST AI RMF', 'Accountability'],
    'content_accuracy': ['NIST AI RMF', 'Institutional Policy'],
    'accessibility_check': ['ADA', 'Section 508'],
    'ip_review': ['Copyright', 'Institutional Policy'],
    'teaching_disclosure': ['Transparency', 'Institutional Policy'],
    'material_review_cycle': ['NIST AI RMF', 'Institutional Policy'],
    'decision_impact': ['NIST AI RMF', 'Fairness'],
    'appeal_process': ['Accountability', 'Institutional Policy'],
    'admin_bias_audit': ['NIST AI RMF', 'Fairness', 'Civil Rights'],
    'data_minimization': ['NIST AI RMF', 'Privacy'],
    'admin_disclosure': ['Transparency', 'Institutional Policy'],
}


# ============== Checkpoint Generation Logic ==============

def rule_context_for(description: str, publisher: str | None) -> dict:
    """The rule context for an activity: what its sentence names, plus the publisher picked for it."""
    detected = detect_rule_context(description or '')
    return {**detected, 'publisher': publisher or detected['publisher']}


def _rule_checkpoints(ai_use_case: str, rule_context: dict) -> list[dict[str, Any]]:
    funders = set(rule_context.get('funders') or [])
    if ai_use_case == GRANT_PROPOSAL:
        items = grant_items(funders)
    elif ai_use_case == PEER_REVIEW:
        items = review_items(funders, rule_context.get('review_of'))
    elif ai_use_case == JOURNAL_MANUSCRIPT:
        items = journal_items(rule_context.get('publisher'))
    else:
        items = []
    return [item.as_checkpoint() for item in items]


def generate_checkpoints_for_use_case(
    ai_use_case: str,
    risk_context: dict | None = None,
    rule_context: dict | None = None,
) -> list[dict[str, Any]]:
    """Return the right set of checkpoints depending on use case and risk context.

    risk_context keys (all bool):
        involves_student_data — Does this involve student records?
        data_leaves_institution — Does data leave institutional systems?
        affects_decisions — Does this affect grades, admissions, or evaluations?
        involves_human_subjects — Does this involve human subjects research?

    rule_context (for grant proposals, peer review, and journal manuscripts),
    from quick_add_parser.detect_rule_context:
        funders — funders named in the sentence, e.g. ['nih']; empty means all
        review_of — 'grant', 'manuscript', or None when unclear
        publisher — journal publisher key (see journal_checklist.PUBLISHERS)
    """
    if risk_context is None:
        risk_context = {}

    base: list[dict[str, Any]] = [
        {
            'checkpoint_id': 'irb',
            'label': 'Confirm your IRB protocol covers AI use',
            'category': 'Regulatory',
            'assigned_to': 'pi',
            'what': 'Verify whether your research requires IRB approval and if your current protocol covers AI use.',
            'why': 'IRB approval obtained before AI tools existed may not cover new AI methods. Using AI on human subjects data without IRB approval that covers it can violate your protocol.',
            'how': 'Check your IRB protocol. If AI is not mentioned, contact your IRB office to determine if an amendment is needed.',
        },
        {
            'checkpoint_id': 'data_classification',
            'label': 'Classify the data you will use',
            'category': 'Data',
            'assigned_to': 'pi',
            'what': 'Identify what type of data you are using and its sensitivity level.',
            'why': 'Different data types have different handling requirements. Identifiable health data requires stricter controls than public datasets.',
            'how': 'Categorize your data: Public, Internal, Confidential, or Restricted. Check if it contains PII, PHI, or other sensitive information.',
        },
        {
            'checkpoint_id': 'ai_disclosure',
            'label': 'Plan how you will disclose AI use',
            'category': 'Transparency',
            'assigned_to': 'pi',
            'what': 'Plan how you will disclose AI use in publications, presentations, and to participants.',
            'why': 'Most journals and conferences now require AI disclosure. Transparency builds trust and is increasingly required by publishers.',
            'how': 'Draft a disclosure statement describing which AI tools were used and for what purpose. Include in your methods section.',
        },
    ]

    data_checkpoints: list[dict[str, Any]] = [
        {
            'checkpoint_id': 'data_deidentified',
            'label': 'Check that the data is de-identified',
            'category': 'Data',
            'assigned_to': 'student',
            'what': 'Ensure personal identifiers are removed before AI processing.',
            'why': 'Sending identifiable data to AI systems (especially cloud-based) may violate privacy regulations and IRB requirements.',
            'how': 'Remove or mask: names, dates, locations, ID numbers, photos, and any combination that could identify someone. Use established de-identification standards (HIPAA Safe Harbor or Expert Determination).',
        },
        {
            'checkpoint_id': 'data_storage',
            'label': 'Confirm where data and AI outputs are stored',
            'category': 'Data',
            'assigned_to': 'student',
            'what': 'Verify that data and AI outputs are stored securely.',
            'why': 'Research data requires protection from unauthorized access. Cloud AI services may retain data unless configured otherwise.',
            'how': 'Use institutional approved storage. Check AI service data retention policies. Enable encryption at rest and in transit.',
        },
    ]

    model_checkpoints: list[dict[str, Any]] = [
        {
            'checkpoint_id': 'bias_audit',
            'label': 'Check results for bias',
            'category': 'Model',
            'assigned_to': 'student',
            'what': 'Test your AI model for unfair or biased outcomes across different groups.',
            'why': 'AI models can perpetuate or amplify biases in training data, leading to unfair outcomes for certain populations.',
            'how': 'Evaluate model performance across demographic subgroups (age, gender, race if applicable). Compare error rates and outcomes. Document any disparities found and mitigation steps taken.',
        },
        {
            'checkpoint_id': 'human_review',
            'label': 'Decide how a person reviews AI output',
            'category': 'Model',
            'assigned_to': 'pi',
            'what': 'Establish how humans will review and validate AI outputs.',
            'why': 'AI systems make errors. Human oversight catches mistakes and maintains accountability, especially for consequential decisions.',
            'how': 'Define: Who reviews AI outputs? What percentage is reviewed? What are the criteria for acceptance/rejection? Document the review process.',
        },
    ]

    qualitative_checkpoints: list[dict[str, Any]] = [
        {
            'checkpoint_id': 'ai_coding_disclosure',
            'label': 'Disclose AI-assisted coding',
            'category': 'Transparency',
            'assigned_to': 'student',
            'what': 'Document how AI was used in qualitative coding or analysis.',
            'why': 'Using AI to code interviews or analyze text changes the methodology. Reviewers and readers need to evaluate this.',
            'how': 'Describe the AI tool used, what it did (initial codes, theme suggestions), and how human researchers validated or modified the output.',
        },
        {
            'checkpoint_id': 'participant_consent',
            'label': 'Check that participant consent covers AI use',
            'category': 'Regulatory',
            'assigned_to': 'pi',
            'what': 'Ensure consent forms mention AI processing of participant data.',
            'why': 'Participants have a right to know their data will be processed by AI systems, especially if using cloud-based tools.',
            'how': 'Review consent forms. If AI use was not mentioned, consult IRB about whether re-consent or notification is needed.',
        },
    ]

    writing_checkpoints: list[dict[str, Any]] = [
        {
            'checkpoint_id': 'ai_writing_disclosure',
            'label': 'Disclose AI writing assistance',
            'category': 'Transparency',
            'assigned_to': 'student',
            'what': 'Document any AI assistance in drafting or editing text.',
            'why': 'Journals require disclosure of AI writing tools. Undisclosed use may be considered a form of misconduct.',
            'how': 'List AI tools used (e.g., ChatGPT, Grammarly AI). Describe the extent: grammar checking, sentence rephrasing, content generation. Place in acknowledgments or methods.',
        },
    ]

    grading_checkpoints: list[dict[str, Any]] = [
        {
            'checkpoint_id': 'grading_fairness',
            'label': 'Check AI grades for fairness',
            'category': 'Assessment',
            'assigned_to': 'pi',
            'what': 'Verify AI grading produces equitable outcomes across student demographics.',
            'why': 'AI grading tools can carry biases from training data, leading to unfair outcomes for certain student groups.',
            'how': 'Compare AI-generated grades across demographic subgroups. Check for statistically significant disparities. Document findings and any corrections made.',
        },
        {
            'checkpoint_id': 'ferpa_compliance',
            'label': 'Check whether FERPA applies to this data',
            'category': 'Regulatory',
            'assigned_to': 'pi',
            'what': 'Confirm student records processed by AI are handled per FERPA requirements.',
            'why': 'Student education records are protected under FERPA. Sending them to external AI services may violate federal law.',
            'how': 'Check that AI processing happens on institution-approved systems. Check vendor data processing agreements. Confirm no student data is retained by third-party AI services.',
        },
        {
            'checkpoint_id': 'grading_transparency',
            'label': 'Share grading criteria with students',
            'category': 'Transparency',
            'assigned_to': 'pi',
            'what': 'Ensure students are informed that AI is used in the grading process.',
            'why': 'Students have a right to know how their work is evaluated. Transparency builds trust and meets institutional policy requirements.',
            'how': 'Update your syllabus to include AI grading disclosure. Communicate in class and provide an opt-out or appeal mechanism if required by policy.',
        },
        {
            'checkpoint_id': 'human_override',
            'label': 'Decide how you will override AI grades',
            'category': 'Assessment',
            'assigned_to': 'pi',
            'what': 'Define a process for students to appeal or request human review of AI-assisted grades.',
            'why': 'Students must have recourse when they believe an AI grade is incorrect. This is both an ethical and often institutional requirement.',
            'how': 'Establish a clear appeal window (e.g., 7 days). Document the process in the syllabus. Ensure a human instructor reviews all appeals.',
        },
        {
            'checkpoint_id': 'grading_validation',
            'label': 'Spot-check AI grades against your own',
            'category': 'Assessment',
            'assigned_to': 'pi',
            'what': 'Sample and validate AI-generated grades against instructor judgment.',
            'why': 'AI grading must be verified for accuracy before being applied at scale. Unvalidated AI grades risk harming student outcomes.',
            'how': 'Review a random 20-25% sample of AI grades. Compare with your own assessment. Document agreement rate and any adjustments made.',
        },
    ]

    teaching_checkpoints: list[dict[str, Any]] = [
        {
            'checkpoint_id': 'content_accuracy',
            'label': 'Check AI-generated content for accuracy',
            'category': 'Quality',
            'assigned_to': 'pi',
            'what': 'Review AI-generated teaching materials for factual accuracy.',
            'why': 'AI can produce plausible-sounding but incorrect information. Distributing inaccurate materials undermines educational quality.',
            'how': 'Have a subject matter expert review all AI-generated content. Cross-reference claims with authoritative sources. Flag and correct any inaccuracies.',
        },
        {
            'checkpoint_id': 'accessibility_check',
            'label': 'Check materials for accessibility',
            'category': 'Quality',
            'assigned_to': 'pi',
            'what': 'Ensure AI-generated materials meet accessibility requirements (ADA/Section 508).',
            'why': 'Institutions must provide accessible materials to all students. AI-generated content often lacks proper accessibility features.',
            'how': 'Test materials with screen readers. Ensure alt text, proper heading structure, and sufficient color contrast. Follow WCAG 2.1 AA guidelines.',
        },
        {
            'checkpoint_id': 'ip_review',
            'label': 'Review intellectual property questions',
            'category': 'Regulatory',
            'assigned_to': 'pi',
            'what': 'Confirm AI-generated content does not infringe on existing copyrights.',
            'why': 'AI models trained on copyrighted material may reproduce protected content. Using such content in teaching materials creates legal risk.',
            'how': 'Check AI output for close similarity to known sources. Understand your institution\'s IP policy regarding AI-generated content. Add attribution where appropriate.',
        },
        {
            'checkpoint_id': 'teaching_disclosure',
            'label': 'Tell students how you use AI',
            'category': 'Transparency',
            'assigned_to': 'pi',
            'what': 'Inform students that course materials include AI-generated content.',
            'why': 'Transparency about AI use in teaching sets expectations and models responsible AI practices for students.',
            'how': 'Add a disclosure statement to your syllabus. Label AI-generated materials clearly. Discuss AI\'s role in course material creation during the first class.',
        },
        {
            'checkpoint_id': 'material_review_cycle',
            'label': 'Set a date to review this use again',
            'category': 'Quality',
            'assigned_to': 'pi',
            'what': 'Schedule regular reviews of AI-generated teaching materials for continued accuracy.',
            'why': 'AI-generated content may become outdated as knowledge evolves. Regular review ensures materials remain current and accurate.',
            'how': 'Set a review schedule (e.g., quarterly or each semester). Document review dates and any updates made. Assign responsibility for ongoing review.',
        },
    ]

    admin_checkpoints: list[dict[str, Any]] = [
        {
            'checkpoint_id': 'decision_impact',
            'label': 'Assess how AI affects decisions about people',
            'category': 'Governance',
            'assigned_to': 'pi',
            'what': 'Document who is affected by AI-assisted administrative decisions and how.',
            'why': 'Administrative decisions (admissions, resource allocation, scheduling) carry high-stakes consequences for individuals and groups.',
            'how': 'Identify all stakeholders affected. Estimate the number of people impacted. Assess potential consequences of incorrect decisions. Document findings.',
        },
        {
            'checkpoint_id': 'appeal_process',
            'label': 'Define how people can appeal a decision',
            'category': 'Governance',
            'assigned_to': 'pi',
            'what': 'Ensure individuals affected by AI-informed decisions can challenge them.',
            'why': 'People affected by automated decisions have a right to human review. This is both an ethical obligation and increasingly a legal requirement.',
            'how': 'Create a written appeal process with clear timelines. Ensure a human decision-maker reviews all appeals. Publish the process where affected parties can find it.',
        },
        {
            'checkpoint_id': 'admin_bias_audit',
            'label': 'Check administrative decisions for bias',
            'category': 'Governance',
            'assigned_to': 'pi',
            'what': 'Test for disparate impact on protected groups in AI-assisted decisions.',
            'why': 'AI systems can perpetuate or amplify existing institutional biases, leading to discrimination in administrative outcomes.',
            'how': 'Analyze decision outcomes across demographic groups. Use disparate impact ratio (4/5ths rule) to identify potential bias. Document findings and corrective actions.',
        },
        {
            'checkpoint_id': 'data_minimization',
            'label': 'Use only the data you need',
            'category': 'Data',
            'assigned_to': 'pi',
            'what': 'Confirm only necessary data is used in administrative AI processing.',
            'why': 'Using excessive personal data increases privacy risk and potential for misuse without improving decision quality.',
            'how': 'Audit which data fields the AI system uses. Remove any fields not essential to the decision. Document the rationale for each retained field.',
        },
        {
            'checkpoint_id': 'admin_disclosure',
            'label': 'Tell affected people how AI is used',
            'category': 'Transparency',
            'assigned_to': 'pi',
            'what': 'Notify people affected by decisions that AI was involved in the process.',
            'why': 'Transparency about AI involvement in decisions builds trust and is increasingly required by institutional policy and regulation.',
            'how': 'Include AI disclosure in decision notification letters/emails. Add disclosure to relevant web pages and application forms. Make the disclosure clear and prominent.',
        },
    ]

    involves_student_data = risk_context.get('involves_student_data', False)
    data_leaves = risk_context.get('data_leaves_institution', False)
    affects_decisions = risk_context.get('affects_decisions', False)
    involves_human_subjects = risk_context.get('involves_human_subjects', False)

    # Start with use-case-specific checkpoints
    checkpoints: list[dict[str, Any]] = []

    if ai_use_case == 'data_analysis':
        checkpoints += data_checkpoints + model_checkpoints
    elif ai_use_case == 'qualitative':
        checkpoints += data_checkpoints + qualitative_checkpoints
    elif ai_use_case == 'ml_model':
        checkpoints += data_checkpoints + model_checkpoints
    elif ai_use_case == 'writing':
        checkpoints += writing_checkpoints
    elif ai_use_case == 'literature':
        checkpoints += writing_checkpoints
    elif ai_use_case == 'grading':
        checkpoints += grading_checkpoints
    elif ai_use_case == 'teaching':
        checkpoints += teaching_checkpoints
    elif ai_use_case == 'admin':
        checkpoints += admin_checkpoints
    elif ai_use_case in RULE_USE_CASES:
        checkpoints += _rule_checkpoints(ai_use_case, rule_context or {})

    existing_ids = {cp['checkpoint_id'] for cp in checkpoints}

    # Map of what's already covered by use-case-specific checkpoints
    # so we don't add generic duplicates
    covered_concerns = set()
    if 'grading_fairness' in existing_ids or 'admin_bias_audit' in existing_ids:
        covered_concerns.add('bias_audit')  # already has a specific bias check
    if 'human_override' in existing_ids:
        covered_concerns.add('human_review')  # already has a specific oversight check
    if 'ferpa_compliance' in existing_ids:
        covered_concerns.add('data_storage')  # FERPA already covers storage concerns

    # Risk-based additions — only add if not already covered
    if involves_student_data or data_leaves:
        for cp in data_checkpoints:
            if cp['checkpoint_id'] not in existing_ids and cp['checkpoint_id'] not in covered_concerns:
                checkpoints.append(cp)
                existing_ids.add(cp['checkpoint_id'])

    if affects_decisions:
        for cp in model_checkpoints:
            if cp['checkpoint_id'] not in existing_ids and cp['checkpoint_id'] not in covered_concerns:
                checkpoints.append(cp)
                existing_ids.add(cp['checkpoint_id'])

    if involves_human_subjects:
        for cp in qualitative_checkpoints:
            if cp['checkpoint_id'] == 'participant_consent' and cp['checkpoint_id'] not in existing_ids:
                checkpoints.append(cp)
                existing_ids.add(cp['checkpoint_id'])

    # Build base — skip IRB and data_classification for non-research use cases.
    # Grant, review, and manuscript checklists carry their own funder and
    # journal items, so they skip the generic base items.
    non_research = {'grading', 'teaching', 'admin'}
    filtered_base = []
    for cp in base:
        if ai_use_case in RULE_USE_CASES:
            continue
        if cp['checkpoint_id'] == 'irb' and ai_use_case in non_research and not involves_human_subjects:
            continue
        if cp['checkpoint_id'] == 'data_classification' and ai_use_case in non_research:
            continue
        filtered_base.append(cp)

    checkpoints = filtered_base + checkpoints

    # Faculty-only use cases: assign ALL checkpoints to PI
    faculty_only_cases = {'grading', 'teaching', 'admin'}
    if ai_use_case in faculty_only_cases:
        checkpoints = [{**cp, 'assigned_to': 'pi'} for cp in checkpoints]

    # Inject framework tags from the mapping (rule-based items bring their own)
    checkpoints = [
        {**cp, 'frameworks': cp.get('frameworks') or FRAMEWORK_MAP.get(cp['checkpoint_id'], [])}
        for cp in checkpoints
    ]

    return checkpoints
