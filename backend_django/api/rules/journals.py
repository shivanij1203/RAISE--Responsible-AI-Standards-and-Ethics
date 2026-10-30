"""Journal and publisher rules on generative AI, from docs/rule_sources/funders_journals.md.

Each quote was compared with the live page on CHECKED_ON. Where the source
notes held a fragment, the quote is the full sentence from the live page.

Springer Nature and APA rules are not here: their pages could not be opened
on CHECKED_ON (see docs/rule_sources/verification.json).
"""
from api.rules.base import CHECKED_ON, Rule, Source

ICMJE_AUTHORS = Source(
    name='ICMJE Recommendations: Use of AI by Authors',
    url='https://icmje.org/recommendations/browse/artificial-intelligence/ai-use-by-authors.html',
    version='No date on page; © 2026',
    last_checked=CHECKED_ON,
)
ICMJE_REVIEWERS = Source(
    name='ICMJE Recommendations: Use of AI by Reviewers',
    url='https://icmje.org/recommendations/browse/artificial-intelligence/ai-use-by-reviewers.html',
    version='No date on page; © 2026',
    last_checked=CHECKED_ON,
)
COPE = Source(
    name='COPE position statement: Authorship and AI tools',
    url='https://publicationethics.org/guidance/cope-position/authorship-and-ai-tools',
    version='Last reviewed 13 February 2023',
    last_checked=CHECKED_ON,
)
ELSEVIER = Source(
    name='Elsevier: Generative AI policies for journals',
    url='https://www.elsevier.com/about/policies-and-standards/generative-ai-policies-for-journals',
    version='Policy updated June 2026',
    last_checked=CHECKED_ON,
)
TAYLOR_FRANCIS = Source(
    name='Taylor & Francis AI Policy',
    url='https://taylorandfrancis.com/our-policies/ai-policy/',
    version='No date on page; © 2026',
    last_checked=CHECKED_ON,
)
IEEE = Source(
    name='IEEE Author Guidelines for AI-Generated Text',
    url='https://open.ieee.org/author-guidelines-for-artificial-intelligence-ai-generated-text/',
    version='April 16, 2024',
    last_checked=CHECKED_ON,
)

JOURNAL_RULES: tuple[Rule, ...] = (
    # ICMJE, authors
    Rule(
        'icmje_ai_not_author', ICMJE_AUTHORS,
        'Chatbots (such as ChatGPT) and other AI-assisted tools should not be listed as authors because they '
        'cannot be responsible for the accuracy, integrity, and originality of the work, and these '
        'responsibilities are required for authorship (see Section II.A.1).',
        'Do not list chatbots or other AI tools as authors.',
    ),
    Rule(
        'icmje_ai_disclosure_cover_letter_and_work', ICMJE_AUTHORS,
        'Authors who use such technology should describe, in both the cover letter and the submitted work in '
        'the appropriate section if applicable, how they used it (see Sections II.A.3 and Section IV.A.3.d).',
        'Describe how you used AI in the cover letter and in the relevant section of the manuscript.',
    ),
    Rule(
        'icmje_ai_nondisclosure_misconduct', ICMJE_AUTHORS,
        'Nondisclosure of AI use may require corrective action and may be construed as misconduct in some '
        'circumstances (see Sections III.A and III.B).',
        'Not disclosing AI use can lead to corrective action.',
    ),
    Rule(
        'icmje_ai_human_review_output', ICMJE_AUTHORS,
        'Authors should carefully review and edit the AI-generated content as the output can be incorrect, '
        'incomplete, or biased.',
        'Review and edit AI output before you submit.',
    ),
    Rule(
        'icmje_ai_not_primary_source', ICMJE_AUTHORS,
        'Referencing AI-generated material as the primary source is not acceptable.',
        'Do not cite AI-generated material as a primary source.',
    ),
    Rule(
        'icmje_ai_no_plagiarism_text_images', ICMJE_AUTHORS,
        'Authors should be able to assert that there is no plagiarism in their paper, including in text and '
        'images produced by the AI.',
        'Make sure AI-produced text and images contain no plagiarism.',
    ),
    # ICMJE, reviewers
    Rule(
        'icmje_review_follow_journal_ai_policy', ICMJE_REVIEWERS,
        'Reviewers must adhere to the journal\'s stated policy on the use of AI or request permission from '
        'the journal prior to using AI technology to facilitate their review.',
        'Follow the journal\'s AI policy, or ask the journal before using AI on a review.',
    ),
    Rule(
        'icmje_review_confidentiality_upload', ICMJE_REVIEWERS,
        'As described in Section II.C.2.c, reviewers must maintain the confidentiality of the manuscript, '
        'which may prohibit the uploading of the manuscript to software or other AI technologies where '
        'confidentiality cannot be assured unless such use of AI is explicitly permitted by journals.',
        'Do not upload a manuscript to an AI tool that cannot keep it confidential, unless the journal allows it.',
    ),
    Rule(
        'icmje_review_disclose_ai', ICMJE_REVIEWERS,
        'Reviewers who use AI in their review should disclose its use to the journal and ensure the content '
        'is appropriate and valid as AI can generate output that can be incorrect, incomplete, or biased.',
        'Tell the journal if you used AI in your review.',
    ),
    # COPE, the general guide RAISE uses for "Other" journals
    Rule(
        'cope_ai_not_author', COPE,
        'AI tools cannot meet the requirements for authorship as they cannot take responsibility for the '
        'submitted work.',
        'AI tools cannot be authors.',
    ),
    Rule(
        'cope_ai_disclosure_methods', COPE,
        'Authors who use AI tools in the writing of a manuscript, production of images or graphical elements '
        'of the paper, or in the collection and analysis of data, must be transparent in disclosing in the '
        'Materials and Methods (or similar section) of the paper how the AI tool was used and which tool was used.',
        'Disclose which AI tool you used and how, in Materials and Methods or a similar section.',
    ),
    Rule(
        'cope_author_full_responsibility', COPE,
        'Authors are fully responsible for the content of their manuscript, even those parts produced by an '
        'AI tool, and are thus liable for any breach of publication ethics.',
        'Authors are responsible for all content, including the parts an AI tool produced.',
    ),
    # Elsevier
    Rule(
        'elsevier_ai_human_oversight', ELSEVIER,
        'AI tools should always be applied with human oversight and control.',
        'Use AI only with human oversight and control.',
    ),
    Rule(
        'elsevier_author_accountable', ELSEVIER,
        'Ultimately, authors are responsible and accountable for the contents of their work.',
        'Authors are responsible for all content, including AI output.',
    ),
    Rule(
        'elsevier_ai_declaration_statement', ELSEVIER,
        'Authors should disclose the use of AI tools for manuscript preparation in a separate AI declaration '
        'statement included in their manuscript upon submission.',
        'Put a separate AI declaration statement in the manuscript at submission.',
    ),
    Rule(
        'elsevier_ai_declaration_template', ELSEVIER,
        'During the preparation of this work, the author(s) used [NAME OF TOOL / SERVICE] in order to '
        '[REASON]. After using this tool/service, the author(s) reviewed and edited the content as needed '
        'and take(s) full responsibility for the content of the published article.',
        'Elsevier\'s suggested statement names the tool and the reason.',
    ),
    Rule(
        'elsevier_grammar_check_exempt', ELSEVIER,
        'Basic checks of grammar, spelling and punctuation do not need a declaration statement.',
        'Basic grammar, spelling, and punctuation checks need no declaration.',
    ),
    Rule(
        'elsevier_ai_not_author', ELSEVIER,
        'Authors should not list AI tools as an author or co-author, nor cite AI tools as an author.',
        'Do not list or cite AI tools as an author.',
    ),
    Rule(
        'elsevier_no_ai_primary_data_images', ELSEVIER,
        'AI tools must not be used to create or alter images that represent primary observed or experimental '
        'data that were not directly obtained in the research.',
        'Do not use AI to create or alter images of primary research data.',
    ),
    Rule(
        'elsevier_review_no_upload', ELSEVIER,
        'Reviewers should not upload a submitted manuscript or any part of it into an AI tool as this may '
        'violate the authors\' confidentiality and proprietary rights and, where the paper contains personally '
        'identifiable information, may breach data privacy rights.',
        'Do not upload a submitted manuscript, or any part of it, into an AI tool.',
    ),
    Rule(
        'elsevier_review_supportive_use_only', ELSEVIER,
        'AI tools may therefore only be used in a supportive capacity, for example to improve the language and '
        'structure of a review report, or to assist with a background literature search, provided that '
        'confidentiality is maintained and human control and oversight are exercised.',
        'Use AI only for supportive tasks, such as polishing a report\'s language, with confidentiality kept.',
    ),
    Rule(
        'elsevier_review_disclose_ai', ELSEVIER,
        'Reviewers should disclose AI use in their review reports, including the tool used and purpose of the use.',
        'Disclose the AI tool and its purpose in the review report.',
    ),
    # Taylor & Francis
    Rule(
        'tandf_ai_not_author', TAYLOR_FRANCIS,
        'Generative AI tools must not be listed as an author because such tools are unable to assume '
        'responsibility for the submitted content or manage copyright and licensing agreements.',
        'Do not list generative AI as an author.',
    ),
    Rule(
        'tandf_ai_acknowledge_use', TAYLOR_FRANCIS,
        'Authors must clearly acknowledge within the article or book any use of Generative AI tools through a '
        'statement that includes: the full name of the tool used (with version number), how it was used and '
        'the reason for use. For article submissions, a specific statement of AI usage disclosure must be included.',
        'Include an AI usage disclosure statement naming the tool and version, how you used it, and why.',
    ),
    # IEEE
    Rule(
        'ieee_ai_disclose_acknowledgments', IEEE,
        'The use of content generated by artificial intelligence (AI) in an article (including but not limited '
        'to text, figures, images, and code) shall be disclosed in the acknowledgments section of any article '
        'submitted to an IEEE publication.',
        'Disclose AI-generated content, including figures and images, in the acknowledgments section.',
    ),
    Rule(
        'ieee_ai_identify_system_and_sections', IEEE,
        'The AI system used shall be identified, and specific sections of the article that use AI-generated '
        'content shall be identified and accompanied by a brief explanation regarding the level at which the '
        'AI system was used to generate the content.',
        'Name the AI system and the sections that use AI-generated content.',
    ),
    Rule(
        'ieee_ai_editing_disclosure_recommended', IEEE,
        'The use of AI systems for editing and grammar enhancement is common practice and, as such, is '
        'generally outside the intent of the above policy. In this case, disclosure as noted above is recommended.',
        'AI used only for editing or grammar falls outside the policy; disclosure is still recommended.',
    ),
)
