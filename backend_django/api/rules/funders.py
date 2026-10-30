"""NIH and NSF rules on generative AI, from docs/rule_sources/funders_journals.md.

Each quote was compared with the live page on CHECKED_ON. Where the source
notes held a fragment, the quote is the full sentence from the live page.
"""
from api.rules.base import CHECKED_ON, Rule, Source

NIH_ORIGINALITY = Source(
    name='NIH NOT-OD-25-132: Supporting Fairness and Originality in NIH Research Applications',
    url='https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-132.html',
    version='Released July 17, 2025',
    last_checked=CHECKED_ON,
)
NIH_PEER_REVIEW = Source(
    name='NIH NOT-OD-23-149: Generative AI is prohibited for the NIH peer review process',
    url='https://grants.nih.gov/grants/guide/notice-files/NOT-OD-23-149.html',
    version='Released June 23, 2023',
    last_checked=CHECKED_ON,
)
NIH_GENOMIC_DATA = Source(
    name='NIH NOT-OD-25-081: Protecting Human Genomic Data when Developing Generative AI Tools and Applications',
    url='https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-081.html',
    version='Released March 28, 2025',
    last_checked=CHECKED_ON,
)
# The NSF notice URL in the source notes (/news/notice-to-the-research-community-on-ai)
# redirects to this page.
NSF_MERIT_REVIEW = Source(
    name='NSF: Use of Generative AI Technology in the NSF Merit Review Process',
    url='https://www.nsf.gov/policies/ai/merit-review',
    version='Published December 14, 2023; last updated May 21, 2026',
    last_checked=CHECKED_ON,
)

FUNDER_RULES: tuple[Rule, ...] = (
    Rule(
        'nih_application_originality', NIH_ORIGINALITY,
        'NIH will not consider applications that are either substantially developed by AI, or contain '
        'sections substantially developed by AI, to be original ideas of applicants.',
        'Do not submit an application, or any section of one, that AI substantially developed.',
    ),
    Rule(
        'nih_ai_limited_use_allowed', NIH_ORIGINALITY,
        'AI tools may be appropriate to assist in application preparation for limited aspects or in '
        'specific circumstances, but researchers should be aware that using AI comes with its own risks.',
        'AI may help with limited parts of preparing an application.',
    ),
    Rule(
        'nih_ai_misconduct_risk', NIH_ORIGINALITY,
        'AI use may result in plagiarism, fabricated citations, or other kinds of research misconduct.',
        'Check AI output for plagiarism and fabricated citations.',
    ),
    Rule(
        'nih_application_limit_six', NIH_ORIGINALITY,
        'NIH will only accept six new, renewal, resubmission, or revision applications from an individual '
        'Principal Investigator/Program Director or Multiple Principal Investigator for all council rounds '
        'in a calendar year.',
        'NIH accepts at most six new, renewal, resubmission, or revision applications per PI per calendar year.',
    ),
    Rule(
        'nih_application_limit_exemptions', NIH_ORIGINALITY,
        'This policy applies to all activity codes except T activity codes and R13 Conference Grant '
        'Applications.',
        'T activity codes and R13 conference grants do not count toward the limit.',
    ),
    Rule(
        'nih_ai_detection_post_award', NIH_ORIGINALITY,
        'If the detection of AI is identified post award, NIH may refer the matter to the Office of Research '
        'Integrity to determine whether there is research misconduct while simultaneously taking enforcement '
        'actions including but not limited to disallowing costs, withholding future awards, wholly or in part '
        'suspending the grant, and possible termination.',
        'If NIH finds AI-generated content after an award, it may refer the case to ORI and take enforcement action.',
    ),
    Rule(
        'nih_review_no_genai_critiques', NIH_PEER_REVIEW,
        'The purpose of this Notice is to clarify NOT-OD-22-044 on Maintaining Security and Confidentiality '
        'in NIH Peer Review: Rules, Responsibilities and Possible Consequences and inform the extramural '
        'community that the NIH prohibits NIH scientific peer reviewers from using natural language '
        'processors, large language models, or other generative Artificial Intelligence (AI) technologies for '
        'analyzing and formulating peer review critiques for grant applications and R&D contract proposals.',
        'NIH reviewers may not use generative AI to analyze applications or write critiques.',
    ),
    Rule(
        'nih_review_no_upload_confidentiality', NIH_PEER_REVIEW,
        'Reviewers should be aware that uploading or sharing content or original concepts from an NIH grant '
        'application, contract proposal, or critique to online generative AI tools violates the NIH peer '
        'review confidentiality and integrity requirements.',
        'Uploading application or critique content to online AI tools breaks NIH review confidentiality.',
    ),
    Rule(
        'nih_controlled_data_no_public_ai', NIH_GENOMIC_DATA,
        'The GDS Policy and the Genomic Data User Code of Conduct state that sharing controlled-access data '
        'with public generative AI tools (e.g., third party tools) via prompts or other user interfaces is in '
        'violation of the provision on Non-Transferability, and by extension, the DUC.',
        'Do not share NIH controlled-access data with public or third-party generative AI tools.',
    ),
    Rule(
        'nsf_review_no_upload_nonapproved_ai', NSF_MERIT_REVIEW,
        'NSF reviewers are prohibited from uploading any content from proposals, review information and '
        'related records to non-approved generative AI tools.',
        'NSF reviewers may not upload proposal content or review records to non-approved AI tools.',
    ),
    Rule(
        'nsf_review_confidentiality_violation', NSF_MERIT_REVIEW,
        'If reviewers take this action, NSF will consider it a violation of the agency\'s confidentiality '
        'pledge and other applicable laws, regulations and policies.',
        'NSF treats such an upload as a breach of its confidentiality pledge.',
    ),
    Rule(
        'nsf_review_public_info_allowed', NSF_MERIT_REVIEW,
        'NSF reviewers may share publicly available information with current generation generative AI tools.',
        'NSF reviewers may give AI tools publicly available information only.',
    ),
    Rule(
        'nsf_proposal_ai_disclosure_encouraged', NSF_MERIT_REVIEW,
        'Proposers are encouraged to indicate in the project description the extent to which, if any, '
        'generative AI technology was used and how it was used to develop their proposal.',
        'NSF encourages, but does not require, proposers to say in the project description how they used AI.',
    ),
    Rule(
        'nsf_proposal_accuracy_responsibility', NSF_MERIT_REVIEW,
        'Proposers are responsible for the accuracy and authenticity of their proposal submission in '
        'consideration for merit review, including content developed with the assistance of generative AI tools.',
        'Proposers answer for the accuracy of the whole proposal, including AI-assisted content.',
    ),
)
