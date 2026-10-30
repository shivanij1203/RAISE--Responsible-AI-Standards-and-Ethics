"""The AI Use Record as a PDF with real, selectable text in reading order.

reportlab cannot write a tagged PDF (no structure tree), so headings are
real text plus PDF bookmarks, and the file carries its title and language
(en-US). There is no logo image here: an untagged PDF cannot give an image
alt text, so the record uses the RAISE name in text instead. The Word
version (record_docx.py) has tagged headings and the logo with alt text.
"""
import io
from xml.sax.saxutils import escape

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from api.services.record_document import HEADING, ITEM, PARAGRAPH, SUBHEADING, TITLE, Block

GREEN = HexColor('#006747')
INK = HexColor('#1C2621')
MUTED = HexColor('#4A554D')

_BASE = ParagraphStyle('base', fontName='Helvetica', fontSize=10, leading=14, textColor=INK, alignment=TA_LEFT)
STYLES = {
    'brand': ParagraphStyle('brand', parent=_BASE, fontName='Helvetica-Bold', fontSize=11, textColor=GREEN,
                            spaceAfter=10),
    TITLE: ParagraphStyle('title', parent=_BASE, fontName='Helvetica-Bold', fontSize=20, leading=24,
                          spaceAfter=6),
    HEADING: ParagraphStyle('heading', parent=_BASE, fontName='Helvetica-Bold', fontSize=13, leading=17,
                            textColor=GREEN, spaceBefore=14, spaceAfter=6),
    SUBHEADING: ParagraphStyle('subheading', parent=_BASE, fontName='Helvetica-Bold', fontSize=11, leading=15,
                               spaceBefore=8, spaceAfter=3),
    PARAGRAPH: ParagraphStyle('paragraph', parent=_BASE, spaceAfter=4),
    ITEM: ParagraphStyle('item', parent=_BASE, fontName='Helvetica-Bold', spaceBefore=4, spaceAfter=1),
    'line': ParagraphStyle('line', parent=_BASE, leftIndent=12, textColor=MUTED, spaceAfter=1),
}
OUTLINE_LEVEL = {TITLE: 0, HEADING: 1, SUBHEADING: 2}


class _HeadingParagraph(Paragraph):
    """A paragraph that adds itself to the PDF's bookmarks (outline)."""

    def __init__(self, text: str, style: ParagraphStyle, level: int, key: str) -> None:
        super().__init__(escape(text), style)
        self.outline_text = text
        self.outline_level = level
        self.outline_key = key

    def draw(self) -> None:
        super().draw()
        self.canv.bookmarkPage(self.outline_key)
        self.canv.addOutlineEntry(self.outline_text, self.outline_key, level=self.outline_level, closed=False)


def _flowables(blocks: list[Block]) -> list:
    story: list = [Paragraph('RAISE · Responsible AI Standards &amp; Ethics', STYLES['brand'])]
    for i, block in enumerate(blocks):
        if block.kind in OUTLINE_LEVEL:
            story.append(_HeadingParagraph(block.text, STYLES[block.kind], OUTLINE_LEVEL[block.kind], f'h{i}'))
        elif block.kind == ITEM:
            story.append(Paragraph(escape(block.text), STYLES[ITEM]))
            for n, line in enumerate(block.lines):
                text = escape(line)
                if n == 0 and block.link:
                    text = f'<link href="{escape(block.link)}" color="#006747"><u>{text}</u></link>'
                story.append(Paragraph(text, STYLES['line']))
        else:
            story.append(Paragraph(escape(block.text), STYLES[PARAGRAPH]))
    story.append(Spacer(1, 6))
    return story


def record_pdf(blocks: list[Block], title: str) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.8 * inch, rightMargin=0.8 * inch, topMargin=0.7 * inch, bottomMargin=0.7 * inch,
        title=title,
        author='RAISE',
        subject='AI Use Record exported from RAISE, a research prototype',
        creator='RAISE',
        lang='en-US',
        displayDocTitle=True,
    )
    doc.build(_flowables(blocks))
    return buffer.getvalue()
