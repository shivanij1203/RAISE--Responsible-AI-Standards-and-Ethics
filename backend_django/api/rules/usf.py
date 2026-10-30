"""USF (Tampa) and Florida Board of Governors rules, from docs/rule_sources/usf_rules.md.

Each quote was compared with the live page on CHECKED_ON. Where the source
notes held a fragment, the quote is the full sentence from the live page.

The sources publish no mapping from any AI tool to a USF data level
(Restricted, Sensitive, Public). Do not add one here.
"""
from api.rules.base import CHECKED_ON, Rule, Source

# Florida BOG Regulation 1.001 (3)(o), AI disclosure in course syllabi.
# 'proposed' until the Board gives final approval; then set it to 'adopted'
# and check the adopted text and effective date. The note RAISE shows is
# chosen from BOG_1001_NOTES by this value.
BOG_1001_STATUS = 'proposed'

USF_COPILOT_IT = Source(
    name='USF IT: Microsoft Copilot Chat at USF',
    url='https://usfjira.atlassian.net/wiki/spaces/UHID/pages/21180284929/Microsoft+Copilot+Chat+at+USF',
    version='Page shows "Updated Apr 20" with no year',
    last_checked=CHECKED_ON,
)
USF_GENAI_GUIDANCE = Source(
    name='Gen AI at USF: University Guidance',
    url='https://genai.usf.edu/at-usf/university-guidance',
    version='No date on page',
    last_checked=CHECKED_ON,
)
USF_GENAI_PRINCIPLES = Source(
    name='USF Guidance for Ethical Generative AI Usage (Office of the Provost)',
    url='https://www.usf.edu/provost/faculty-success/teaching-learning/ai-gen-principles.pdf',
    version='Oct 4, 2023',
    last_checked=CHECKED_ON,
)
USF_SYLLABUS_GUIDANCE = Source(
    name='USF Office of the Provost: Syllabus and Course Guidance on Artificial Intelligence',
    url='https://www.usf.edu/provost/faculty-success/teaching-learning/syllabus-course-guidance.aspx',
    version='Last updated August 2025',
    last_checked=CHECKED_ON,
)
USF_ETD_AI = Source(
    name='USF Graduate Studies: Generative AI & Large Language Models (theses and dissertations)',
    url='https://www.usf.edu/graduate-studies/students/electronic-thesis-dissertation/additional-information/ai.aspx',
    version='No date on page',
    last_checked=CHECKED_ON,
)
BOG_NOTICE_1001 = Source(
    name='Florida Board of Governors: Notice of Proposed Amended Regulation 1.001',
    url='https://www.flbog.edu/wp-content/uploads/2026/09/1.001_09-03-26.pdf',
    version='Notice posted September 3, 2026; comment period closed September 17, 2026',
    last_checked=CHECKED_ON,
)

USF_RULES: tuple[Rule, ...] = (
    Rule(
        'usf_copilot_chat_available', USF_COPILOT_IT,
        'All USF students, faculty and staff have access to Copilot Chat (Basic), and all engagement with '
        'Copilot through your USF accounts occurs in a highly safe, encrypted digital environment.',
        'USF supports Microsoft Copilot Chat when you sign in with your USF account.',
    ),
    Rule(
        'usf_copilot_us_data_restriction', USF_COPILOT_IT,
        'Thus, if funding restrictions require all data to be housed within the United States, Microsoft '
        'Copilot Chat should not be used.',
        'If your funding terms require data to stay in the United States, do not use Copilot Chat.',
    ),
    Rule(
        'usf_public_tools_no_sensitive_data', USF_GENAI_GUIDANCE,
        'Users should not share student data, employment data, and other protected or sensitive information.',
        'Do not share student data, employment data, or other protected or sensitive information with public AI tools.',
    ),
    Rule(
        'usf_public_tools_ferpa_hipaa', USF_GENAI_GUIDANCE,
        'Users must continue to comply with data privacy regulations including FERPA and HIPAA when '
        'interacting with public AI tools.',
        'FERPA and HIPAA still apply when you use public AI tools.',
    ),
    Rule(
        'usf_instructor_discretion', USF_GENAI_PRINCIPLES,
        'In addition, use of genAI tools within university coursework is at the discretion of the instructor '
        'and students are expected to follow course-specific policies.',
        'Whether students may use AI in a course is the instructor\'s choice.',
    ),
    Rule(
        'usf_syllabus_sample_policies', USF_SYLLABUS_GUIDANCE,
        'This policy can be tailored to specific learning goals, including allowing AI for some assignments '
        'but not others, and updating the student responsibilities section.',
        'The Provost offers sample syllabus policies you can adapt: Acceptable Use and Restricted Use.',
    ),
    Rule(
        'usf_etd_permission_and_disclosure', USF_ETD_AI,
        'Disclosing the use of any generative AI for written content and images is required in your ETD, and '
        'generative AI can only be used in your ETD with permission from the entire committee.',
        'A thesis or dissertation may use generative AI only with the whole committee\'s permission, and must disclose it.',
    ),
    Rule(
        'usf_etd_disclosure_appendix', USF_ETD_AI,
        'Include a disclosure of AI use in an Appendix',
        'Put the AI disclosure in an appendix.',
    ),
    Rule(
        'usf_etd_cite_model_version', USF_ETD_AI,
        'Clearly Cite the Model and Version Used',
        'Cite the model and version you used.',
    ),
    Rule(
        'bog_1001_syllabus_ai_proposed', BOG_NOTICE_1001,
        '(o) Each board of trustees must establish policies addressing the use and disclosure of artificial '
        'intelligence in all course syllabi.',
        'Each university board of trustees would set policies on AI use and disclosure in course syllabi.',
    ),
)

BOG_1001_NOTES: dict[str, str] = {
    'proposed': (
        'Pending, not yet a requirement: the Florida Board of Governors has proposed amending Regulation 1.001 '
        'so that each university board of trustees sets policies on the use and disclosure of AI in all course '
        'syllabi. The public comment period has closed and the Board has not given final approval.'
    ),
    'adopted': (
        'The Florida Board of Governors amended Regulation 1.001 so that each university board of trustees '
        'sets policies on the use and disclosure of AI in all course syllabi. Check USF\'s policy for what '
        'your syllabus needs.'
    ),
}
