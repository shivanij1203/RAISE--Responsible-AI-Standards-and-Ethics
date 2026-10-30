"""USF (Tampa) and Florida Board of Governors rules, from docs/rule_sources/usf_rules.md.

Each quote was compared with the live page on CHECKED_ON. Where the source
notes held a fragment, the quote is the full sentence from the live page.

The sources publish no mapping from any AI tool to a USF data level
(Restricted, Sensitive, Public). Do not add one here.
"""
from dataclasses import dataclass

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


# ============== Provost sample syllabus policies ==============

@dataclass(frozen=True)
class SyllabusSample:
    """One of the Provost's sample student AI policies, as the page gives it.

    paragraphs are the student-facing paragraphs only, word for word; the
    page's notes to instructors ("Additional considerations", "Instructional
    Note", formatting tips, examples) are left out.
    """
    key: str
    title: str
    source: Source
    paragraphs: tuple[str, ...]


ACCEPTABLE_USE_SAMPLE = SyllabusSample(
    key='acceptable',
    title='Acceptable Use of Generative AI Tools',
    source=USF_SYLLABUS_GUIDANCE,
    paragraphs=(
        'Definition of Generative AI Tools: Generative AI tools refer to any artificial intelligence-powered '
        'software, program or application that can generate content, including but not limited to text, '
        'visuals, music, and other creative outputs. Examples of these tools include AI text generators, AI '
        'content rewriters, AI graphic generators, etc.',
        'Permitted Use: The use of generative AI tools is permitted for course-related submissions, including '
        'assignments, projects, presentations, examinations, and other forms of assessment. However, students '
        'must responsibly use these tools, adhering to the guidelines outlined in this policy.',
        'Student Responsibility: Students are responsible for appropriately using generative AI tools in their '
        'work. This includes citing all AI-generated content used in their submissions.',
        'Generative AI tools, while powerful, are not infallible and can produce misinformation or inaccurate '
        'results. Students are responsible for the accuracy of their submissions and must cross-verify the '
        'information produced by these tools with reliable sources.',
        'Violation Consequences: Misuse of AI tools, including use of AI that undermines the student learning '
        'objectives of the course or assignment, failing to cite AI-generated content, relying too heavily on '
        'AI for work completion [as defined above in permitted use], or submitting inaccurate information '
        'generated by AI tools, will be subject to academic penalties. Consequences may range from a reduction '
        'in an individual assignment grade to larger academic sanctions per USF policy, depending on the '
        'severity of the violation (USF Regulation 3.027).',
        'Exceptions: If there are specific assignments where the use of AI tools is not appropriate, these will '
        'be clearly marked in the assignment guidelines. Students must adhere to these specific instructions.',
        'Questions and Clarifications: If students are unsure whether a tool they wish to use qualifies as a '
        'generative AI tool, or if they have questions regarding the allowable use of such tools, they should '
        'consult with the course instructor before using it.',
    ),
)

RESTRICTED_USE_SAMPLE = SyllabusSample(
    key='restricted',
    title='Restricted Use of Generative AI Tools',
    source=USF_SYLLABUS_GUIDANCE,
    paragraphs=(
        'Definition of Generative AI Tools: Generative AI tools refer to software or applications powered by '
        'artificial intelligence that produce original content, including but not limited to text, images, '
        'music, data analysis, and code. Examples include ChatGPT, Claude, Gemini, DALL·E, GitHub Copilot, and '
        'AI-based summarizers or paraphrasers.',
        'Prohibited Use: Use of generative AI tools is not permitted for any coursework in this class. This '
        'includes all assignments, papers, projects, exams, presentations, or any other graded component. '
        'Students are expected to complete all work independently, without the aid of AI-generated content.',
        'Student Responsibility: Students are responsible for submitting work that reflects their own original '
        'effort. Use of AI-generated content, even in part, is considered a violation of this policy unless '
        'explicitly authorized. Students must not use AI tools to generate, rewrite, translate, summarize, or '
        'enhance their assignments.',
        'Violation Consequences: Use of AI tools in violation of this policy will be treated as a breach of '
        'academic integrity under USF Regulation 3.027. Consequences may include assignment failure, course '
        'grade penalties, or further disciplinary action depending on the severity of the offense.',
        'Exceptions: If any future assignments allow limited or guided AI use, explicit permission will be '
        'provided in the assignment instructions. In the absence of such permission, students should assume '
        'that AI use is not allowed.',
        'Questions and Clarifications: Students who are unsure whether a tool or method violates this policy '
        'should consult the instructor before using it. Uncertainty is not an excuse for academic misconduct.',
    ),
)

SYLLABUS_SAMPLES: dict[str, SyllabusSample] = {
    s.key: s for s in (ACCEPTABLE_USE_SAMPLE, RESTRICTED_USE_SAMPLE)
}
