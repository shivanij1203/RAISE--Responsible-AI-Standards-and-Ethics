"""The journal manuscript checklist, which follows the publisher the person picks.

The checklist always has the same four items (authorship, disclosure,
checking output, images), so switching publisher keeps any history on them.
Their wording and sources come from the chosen publisher's verified rules.
Where RAISE has no verified rule from that publisher, the item says so
instead of guessing.
"""
from dataclasses import dataclass

from api.rules import RULES_BY_ID
from api.services.rule_items import RuleItem

AUTHORSHIP = 'journal_ai_authorship'
DISCLOSURE = 'journal_ai_disclosure'
ACCURACY = 'journal_ai_accuracy'
IMAGES = 'journal_ai_images'
JOURNAL_ITEM_IDS = (AUTHORSHIP, DISCLOSURE, ACCURACY, IMAGES)

CATEGORY = {AUTHORSHIP: 'Integrity', DISCLOSURE: 'Transparency', ACCURACY: 'Quality', IMAGES: 'Integrity'}
GENERIC_LABEL = {
    AUTHORSHIP: 'Do not list AI as an author',
    DISCLOSURE: 'Disclose AI use where the journal asks',
    ACCURACY: 'Check AI output before you submit',
    IMAGES: 'Check the rules for AI-made images',
}
# Labels for an item where RAISE has no verified rule from the publisher:
# they point to the journal's guidelines instead of stating a rule.
NO_RULE_LABEL = {
    AUTHORSHIP: "Check the journal's rules on AI authorship",
    DISCLOSURE: 'Check where the journal wants AI use disclosed',
    ACCURACY: "Check the journal's rules on checking AI output",
    IMAGES: "Check the journal's rules on AI-made images",
}
TOPIC = {
    AUTHORSHIP: 'listing AI as an author',
    DISCLOSURE: 'where to disclose AI use',
    ACCURACY: 'checking AI output',
    IMAGES: 'AI-made images',
}

DEFAULT_PUBLISHER = 'other'
TOOLS_PLACEHOLDER = '{tools}'


@dataclass(frozen=True)
class Wording:
    label: str
    what: str
    why: str
    how: str
    rules: tuple[str, ...]


@dataclass(frozen=True)
class DisclosureGuide:
    # Where the statement goes, finishing "Put it in ...".
    location: str
    # The draft statement. {tools} is replaced with the tool names.
    draft: str
    # The rule whose suggested wording the draft uses, or None for RAISE's own draft.
    wording_rule: str | None
    rules: tuple[str, ...]


@dataclass(frozen=True)
class Publisher:
    key: str
    label: str
    # Short name used in sentences and as the badge.
    name: str
    wording: dict[str, Wording]
    disclosure: DisclosureGuide
    # Why RAISE has no rules for this publisher, if it has none.
    unverified_reason: str = ''


def _no_rule(publisher_name: str, item_id: str, reason: str = '') -> Wording:
    prefix = f'{reason} ' if reason else ''
    return Wording(
        label=NO_RULE_LABEL[item_id],
        what=f'{prefix}RAISE has no verified {publisher_name} rule on {TOPIC[item_id]} yet.',
        why='RAISE shows only rules it has checked against the publisher\'s own page.',
        how=f'Check {publisher_name}\'s author guidelines for {TOPIC[item_id]} and record what they say.',
        rules=(),
    )


_RAISE_DRAFT = (
    f'The author(s) used {TOOLS_PLACEHOLDER} to [describe how and why you used it]. The author(s) reviewed '
    'and edited the output and take full responsibility for the content.'
)

_REVIEW_HOW = 'Check the author list and the contributions statement. Describe AI use in the disclosure instead.'
_CHECK_HOW = 'Read every passage the AI touched, and check each citation against the original source.'

ICMJE = Publisher(
    key='icmje', label='Journal that follows ICMJE', name='ICMJE',
    wording={
        AUTHORSHIP: Wording(
            label=GENERIC_LABEL[AUTHORSHIP],
            what='ICMJE says chatbots and other AI-assisted tools should not be listed as authors.',
            why='They cannot be responsible for the accuracy, integrity, and originality of the work, and '
                'authorship requires those responsibilities.',
            how=_REVIEW_HOW,
            rules=('icmje_ai_not_author',),
        ),
        DISCLOSURE: Wording(
            label='Describe AI use in the cover letter and the manuscript',
            what='ICMJE asks authors who use AI to describe how they used it in both the cover letter and the '
                 'appropriate section of the submitted work.',
            why='ICMJE says nondisclosure of AI use may require corrective action and may be construed as '
                'misconduct in some circumstances.',
            how='Use the Disclosure button to draft the statement. Put it in the cover letter and in the section '
                'of the manuscript the journal asks for.',
            rules=('icmje_ai_disclosure_cover_letter_and_work', 'icmje_ai_nondisclosure_misconduct'),
        ),
        ACCURACY: Wording(
            label=GENERIC_LABEL[ACCURACY],
            what='ICMJE asks authors to carefully review and edit AI-generated content, and says referencing '
                 'AI-generated material as the primary source is not acceptable.',
            why='AI output can be incorrect, incomplete, or biased.',
            how=_CHECK_HOW,
            rules=('icmje_ai_human_review_output', 'icmje_ai_not_primary_source'),
        ),
        IMAGES: Wording(
            label='Check AI-made text and images for plagiarism',
            what='ICMJE asks authors to be able to assert there is no plagiarism in the paper, including in text '
                 'and images produced by AI.',
            why='Authors make that assertion for the whole paper, including the parts AI produced.',
            how='Check each AI-made figure, image, and passage for material taken from other sources.',
            rules=('icmje_ai_no_plagiarism_text_images',),
        ),
    },
    disclosure=DisclosureGuide(
        location='the cover letter and the appropriate section of the manuscript',
        draft=_RAISE_DRAFT, wording_rule=None,
        rules=('icmje_ai_disclosure_cover_letter_and_work',),
    ),
)

ELSEVIER = Publisher(
    key='elsevier', label='Elsevier', name='Elsevier',
    wording={
        AUTHORSHIP: Wording(
            label=GENERIC_LABEL[AUTHORSHIP],
            what='Elsevier says not to list AI tools as an author or co-author, or cite AI tools as an author.',
            why='Elsevier says authors are responsible and accountable for the contents of their work.',
            how=_REVIEW_HOW,
            rules=('elsevier_ai_not_author', 'elsevier_author_accountable'),
        ),
        DISCLOSURE: Wording(
            label='Add a separate AI declaration statement',
            what='Elsevier asks authors to disclose AI use for manuscript preparation in a separate AI '
                 'declaration statement in the manuscript at submission. Basic checks of grammar, spelling, and '
                 'punctuation need no declaration.',
            why='Elsevier gives suggested wording that names the tool and the reason, and says the authors '
                'reviewed the output and take full responsibility for the content.',
            how='Use the Disclosure button. It fills in Elsevier\'s suggested wording with your tools; replace '
                '[REASON] with what you used AI for.',
            rules=('elsevier_ai_declaration_statement', 'elsevier_ai_declaration_template',
                   'elsevier_grammar_check_exempt'),
        ),
        ACCURACY: Wording(
            label=GENERIC_LABEL[ACCURACY],
            what='Elsevier says AI tools should always be applied with human oversight and control.',
            why='Elsevier says authors are responsible and accountable for the contents of their work.',
            how=_CHECK_HOW,
            rules=('elsevier_ai_human_oversight', 'elsevier_author_accountable'),
        ),
        IMAGES: Wording(
            label='Do not use AI to create or alter images of your data',
            what='Elsevier says AI tools must not be used to create or alter images that represent primary '
                 'observed or experimental data.',
            why='Images of primary data must show data directly obtained in the research.',
            how='Make every data figure from your own results, without AI changes.',
            rules=('elsevier_no_ai_primary_data_images',),
        ),
    },
    disclosure=DisclosureGuide(
        location='a separate AI declaration statement in the manuscript',
        draft=RULES_BY_ID['elsevier_ai_declaration_template'].quote.replace(
            '[NAME OF TOOL / SERVICE]', TOOLS_PLACEHOLDER),
        wording_rule='elsevier_ai_declaration_template',
        rules=('elsevier_ai_declaration_statement', 'elsevier_ai_declaration_template'),
    ),
)

TAYLOR_FRANCIS = Publisher(
    key='taylor_francis', label='Taylor & Francis', name='Taylor & Francis',
    wording={
        AUTHORSHIP: Wording(
            label=GENERIC_LABEL[AUTHORSHIP],
            what='Taylor & Francis says generative AI tools must not be listed as an author.',
            why='Such tools cannot assume responsibility for the submitted content or manage copyright and '
                'licensing agreements.',
            how=_REVIEW_HOW,
            rules=('tandf_ai_not_author',),
        ),
        DISCLOSURE: Wording(
            label='Add an AI usage disclosure statement',
            what='Taylor & Francis asks authors to acknowledge any use of generative AI tools within the article, '
                 'in a statement that gives the full name of the tool (with version number), how it was used, '
                 'and the reason. Article submissions must include a specific AI usage disclosure statement.',
            why='The statement is required for any use of generative AI tools in the article.',
            how='Use the Disclosure button to draft it, then add the version number of each tool.',
            rules=('tandf_ai_acknowledge_use',),
        ),
        ACCURACY: _no_rule('Taylor & Francis', ACCURACY),
        IMAGES: _no_rule('Taylor & Francis', IMAGES),
    },
    disclosure=DisclosureGuide(
        location='an AI usage disclosure statement within the article',
        draft=(f'The author(s) used {TOOLS_PLACEHOLDER} (version [VERSION]) to [describe how you used it] '
               'because [reason for use].'),
        wording_rule=None,
        rules=('tandf_ai_acknowledge_use',),
    ),
)

IEEE = Publisher(
    key='ieee', label='IEEE', name='IEEE',
    wording={
        AUTHORSHIP: _no_rule('IEEE', AUTHORSHIP),
        DISCLOSURE: Wording(
            label='Disclose AI use in the acknowledgments',
            what='IEEE asks that AI-generated content in an article, including text, figures, images, and code, '
                 'be disclosed in the acknowledgments section. Name the AI system and the sections that use its '
                 'content, with a brief note on how much it was used.',
            why='IEEE says AI used only for editing and grammar falls outside this policy, but it still '
                'recommends disclosure in that case.',
            how='Use the Disclosure button to draft the acknowledgment, then list the sections that use AI content.',
            rules=('ieee_ai_disclose_acknowledgments', 'ieee_ai_identify_system_and_sections',
                   'ieee_ai_editing_disclosure_recommended'),
        ),
        ACCURACY: _no_rule('IEEE', ACCURACY),
        IMAGES: Wording(
            label='Disclose AI-made figures and images',
            what='IEEE\'s disclosure rule covers AI-generated figures and images as well as text and code.',
            why='They are disclosed in the acknowledgments section with the rest of the AI-generated content.',
            how='List each AI-made figure or image in the acknowledgment.',
            rules=('ieee_ai_disclose_acknowledgments',),
        ),
    },
    disclosure=DisclosureGuide(
        location='the acknowledgments section',
        draft=(f'The author(s) used {TOOLS_PLACEHOLDER} to generate content in the following sections: '
               '[SECTIONS]. [Briefly explain the level at which the AI system was used.]'),
        wording_rule=None,
        rules=('ieee_ai_disclose_acknowledgments', 'ieee_ai_identify_system_and_sections'),
    ),
)

OTHER = Publisher(
    key='other', label='Other journal', name='COPE',
    wording={
        AUTHORSHIP: Wording(
            label=GENERIC_LABEL[AUTHORSHIP],
            what='COPE says AI tools cannot meet the requirements for authorship.',
            why='They cannot take responsibility for the submitted work.',
            how=_REVIEW_HOW,
            rules=('cope_ai_not_author',),
        ),
        DISCLOSURE: Wording(
            label='Disclose AI use in Materials and Methods',
            what='COPE says authors who use AI tools for writing, images, or data collection and analysis must '
                 'disclose in Materials and Methods (or a similar section) how the tool was used and which tool.',
            why='RAISE uses COPE\'s position statement as a general guide when you have not picked a publisher. '
                'Your journal may set its own rules.',
            how='Check your journal\'s author guidelines, then use the Disclosure button to draft a statement.',
            rules=('cope_ai_disclosure_methods',),
        ),
        ACCURACY: Wording(
            label=GENERIC_LABEL[ACCURACY],
            what='COPE says authors are fully responsible for the content of their manuscript, even the parts an '
                 'AI tool produced.',
            why='Authors are liable for any breach of publication ethics.',
            how=_CHECK_HOW,
            rules=('cope_author_full_responsibility',),
        ),
        IMAGES: Wording(
            label='Disclose AI-made images',
            what='COPE\'s disclosure rule covers AI used to produce images or graphical elements of the paper.',
            why='They are disclosed in Materials and Methods (or a similar section) with the rest of the AI use.',
            how='List each AI-made image or graphic in the disclosure.',
            rules=('cope_ai_disclosure_methods',),
        ),
    },
    disclosure=DisclosureGuide(
        location='Materials and Methods (or a similar section)',
        draft=_RAISE_DRAFT, wording_rule=None,
        rules=('cope_ai_disclosure_methods',),
    ),
)


def _unverified(key: str, label: str, name: str) -> Publisher:
    reason = f'RAISE could not open {name}\'s AI policy page when it last checked its sources.'
    return Publisher(
        key=key, label=label, name=name,
        wording={item_id: _no_rule(name, item_id, reason) for item_id in JOURNAL_ITEM_IDS},
        disclosure=DisclosureGuide(
            location="the place your journal's author guidelines name",
            draft=_RAISE_DRAFT, wording_rule=None, rules=(),
        ),
        unverified_reason=reason,
    )


# Springer Nature and APA pages could not be opened on the check date
# (docs/rule_sources/verification.json), so they carry no rules yet.
SPRINGER_NATURE = _unverified('springer_nature', 'Springer Nature / Nature', 'Springer Nature')
APA = _unverified('apa', 'APA', 'APA')

PUBLISHERS: dict[str, Publisher] = {
    p.key: p for p in (ICMJE, ELSEVIER, SPRINGER_NATURE, APA, TAYLOR_FRANCIS, IEEE, OTHER)
}


def publisher_for(key: str | None) -> Publisher:
    return PUBLISHERS.get(key or '', PUBLISHERS[DEFAULT_PUBLISHER])


def journal_item(item_id: str, publisher_key: str | None) -> RuleItem:
    publisher = publisher_for(publisher_key)
    w = publisher.wording[item_id]
    return RuleItem(
        checkpoint_id=item_id, label=w.label, category=CATEGORY[item_id],
        what=w.what, why=w.why, how=w.how, rules=w.rules, frameworks=(publisher.name,),
    )


def journal_items(publisher_key: str | None) -> list[RuleItem]:
    return [journal_item(item_id, publisher_key) for item_id in JOURNAL_ITEM_IDS]
