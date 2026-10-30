"""Checklist items for grant proposals and peer review, built on NIH, NSF, and journal rules.

Every statement here restates a rule in api.rules; the rule IDs on each item
are shown to the person as its sources.
"""
from api.services.rule_items import INFO, RuleItem

NIH = 'nih'
NSF = 'nsf'
FUNDERS = (NIH, NSF)

GRANT = 'grant'
MANUSCRIPT = 'manuscript'

# ============== Grant proposal ==============

GRANT_ITEMS: dict[str, tuple[RuleItem, ...]] = {
    NIH: (
        RuleItem(
            checkpoint_id='grant_nih_originality',
            label='Keep the application your own work (NIH)',
            category='Integrity',
            what='NIH will not treat an application, or any section of one, that AI substantially developed as '
                 'your original ideas. AI may help with limited parts of preparing it.',
            why='NIH warns that AI use may result in plagiarism, fabricated citations, or other kinds of '
                'research misconduct.',
            how='Write the aims, approach, and other sections yourself. Keep any AI help to limited tasks, and '
                'check every citation and passage it touched before you submit.',
            rules=('nih_application_originality', 'nih_ai_limited_use_allowed', 'nih_ai_misconduct_risk'),
            frameworks=('NIH',),
            # NIH will not treat a substantially AI-developed application as original.
            high_priority=True,
        ),
        RuleItem(
            checkpoint_id='grant_nih_post_award',
            label='Know what NIH can do if it finds AI after an award',
            category='Integrity',
            what='If NIH finds AI-generated content after an award, it may refer the matter to the Office of '
                 'Research Integrity.',
            why='At the same time NIH may take enforcement action, including disallowing costs, withholding '
                'future awards, suspending the grant, or terminating it.',
            how='Keep a note of where and how you used AI while preparing the application, so you can answer '
                'questions about it later.',
            rules=('nih_ai_detection_post_award',),
            frameworks=('NIH',),
        ),
        RuleItem(
            checkpoint_id='grant_nih_controlled_data',
            label='Keep NIH controlled-access data out of public AI tools',
            category='Data',
            what='If the project uses NIH controlled-access data, such as genomic data you received through a '
                 'Data Access Request, do not share it with public or third-party generative AI tools through '
                 'prompts or any other interface.',
            why='NIH says sharing controlled-access data with public generative AI tools violates the '
                'Non-Transferability provision of the Data Use Certification.',
            how='List the datasets the proposal relies on and mark any that are controlled-access. Keep those '
                'out of every AI prompt, including while you draft text about them.',
            rules=('nih_controlled_data_no_public_ai',),
            frameworks=('NIH',),
        ),
        RuleItem(
            checkpoint_id='grant_nih_application_limit',
            label='NIH accepts six applications per PI per year',
            category='Information',
            what='NIH accepts at most six new, renewal, resubmission, or revision applications from one PI or '
                 'multiple PI across all council rounds in a calendar year. T activity codes and R13 conference '
                 'grants do not count.',
            why='The limit comes from the same NIH notice as the rule on AI and originality.',
            how='Nothing to record unless you are close to the limit. Count the applications you have submitted '
                'as PI or MPI this calendar year.',
            rules=('nih_application_limit_six', 'nih_application_limit_exemptions'),
            frameworks=('NIH',),
            kind=INFO,
        ),
    ),
    NSF: (
        RuleItem(
            checkpoint_id='grant_nsf_disclosure',
            label='Say how you used AI in the project description (NSF)',
            category='Transparency',
            what='NSF encourages proposers to say in the project description whether and how they used '
                 'generative AI to develop the proposal. It is encouraged, not required.',
            why='Proposers are responsible for the accuracy and authenticity of the proposal, including content '
                'developed with AI.',
            how='If you used AI, add one or two sentences to the project description naming the tool and what '
                'you used it for.',
            rules=('nsf_proposal_ai_disclosure_encouraged', 'nsf_proposal_accuracy_responsibility'),
            frameworks=('NSF',),
        ),
    ),
}

# ============== Peer review ==============

REVIEW_FUNDER_ITEMS: dict[str, tuple[RuleItem, ...]] = {
    NIH: (
        RuleItem(
            checkpoint_id='review_nih_no_ai',
            label='Do not use AI on NIH applications you review',
            category='Confidentiality',
            what='NIH prohibits its peer reviewers from using generative AI to analyze applications or write '
                 'critiques, for grant applications and R&D contract proposals.',
            why='Uploading or sharing content or ideas from an application, proposal, or critique to online '
                'generative AI tools violates NIH peer review confidentiality and integrity requirements.',
            how='Read and write the critique yourself. Do not paste any part of the application or your critique '
                'into an AI tool.',
            rules=('nih_review_no_genai_critiques', 'nih_review_no_upload_confidentiality'),
            frameworks=('NIH',),
            high_priority=True,
        ),
    ),
    NSF: (
        RuleItem(
            checkpoint_id='review_nsf_no_upload',
            label='Do not upload NSF proposal content to non-approved AI tools',
            category='Confidentiality',
            what='NSF reviewers may not upload any content from proposals, review information, or related '
                 'records to non-approved generative AI tools. Publicly available information may be shared.',
            why='NSF treats such an upload as a violation of its confidentiality pledge and other laws, '
                'regulations, and policies.',
            how='Keep proposal text, budgets, and your review notes out of AI tools. Use AI only with information '
                'that is already public.',
            rules=('nsf_review_no_upload_nonapproved_ai', 'nsf_review_confidentiality_violation',
                   'nsf_review_public_info_allowed'),
            frameworks=('NSF',),
            high_priority=True,
        ),
    ),
}

REVIEW_JOURNAL_ITEMS: tuple[RuleItem, ...] = (
    RuleItem(
        checkpoint_id='review_journal_no_upload',
        label='Keep the manuscript out of AI tools',
        category='Confidentiality',
        what='ICMJE says reviewers must keep the manuscript confidential, which may rule out uploading it to AI '
             'tools unless the journal explicitly allows it. Elsevier says not to upload a submitted manuscript, '
             'or any part of it, into an AI tool.',
        why='Elsevier says an upload may violate the authors\' confidentiality and proprietary rights, and data '
            'privacy rights where the paper holds personal information. ICMJE says to follow the journal\'s AI '
            'policy, or ask the journal before using AI.',
        how='Check the journal\'s reviewer guidelines. If you use AI at all, keep it to supportive tasks such as '
            'improving the language of your report, without the manuscript text.',
        rules=('icmje_review_confidentiality_upload', 'icmje_review_follow_journal_ai_policy',
               'elsevier_review_no_upload', 'elsevier_review_supportive_use_only'),
        frameworks=('ICMJE', 'Elsevier'),
        high_priority=True,
    ),
    RuleItem(
        checkpoint_id='review_journal_disclose',
        label='Disclose any AI use in your review',
        category='Transparency',
        what='ICMJE and Elsevier ask reviewers who use AI to disclose it. Elsevier asks for the tool and the '
             'purpose in the review report.',
        why='AI output can be incorrect, incomplete, or biased, and the editor needs to know how the review was '
            'written.',
        how='If you used AI, add a line to your review report naming the tool and what you used it for.',
        rules=('icmje_review_disclose_ai', 'elsevier_review_disclose_ai'),
        frameworks=('ICMJE', 'Elsevier'),
        high_priority=True,
    ),
)


def _funders_or_all(funders: set[str]) -> tuple[str, ...]:
    """The funders named in the sentence, or all of them when none is named."""
    named = tuple(f for f in FUNDERS if f in funders)
    return named or FUNDERS


def grant_items(funders: set[str]) -> list[RuleItem]:
    return [item for funder in _funders_or_all(funders) for item in GRANT_ITEMS[funder]]


def review_items(funders: set[str], review_of: str | None) -> list[RuleItem]:
    """Funder items for a grant review, journal items for a manuscript, both when unclear."""
    items: list[RuleItem] = []
    if review_of != MANUSCRIPT:
        items += [item for funder in _funders_or_all(funders) for item in REVIEW_FUNDER_ITEMS[funder]]
    if review_of != GRANT:
        items += list(REVIEW_JOURNAL_ITEMS)
    return items


ALL_RESEARCH_ITEMS: tuple[RuleItem, ...] = (
    *(item for items in GRANT_ITEMS.values() for item in items),
    *(item for items in REVIEW_FUNDER_ITEMS.values() for item in items),
    *REVIEW_JOURNAL_ITEMS,
)
