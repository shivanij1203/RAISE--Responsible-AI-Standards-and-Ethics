from django.contrib.auth.models import User
from django.db import models

from .project import Project


class CourseStatement(models.Model):
    """A syllabus AI statement a professor built in RAISE and can reopen to edit.

    Owned by one user and deleted with them, so a demo visitor's statements
    are purged with their demo session.
    """

    POLICY_CHOICES = [
        ('acceptable', 'USF Provost sample: Acceptable Use'),
        ('restricted', 'USF Provost sample: Restricted Use'),
        ('custom', 'Written by the professor'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_statements')
    course_name = models.CharField(max_length=200)
    term = models.CharField(max_length=100)
    projects = models.ManyToManyField(Project, blank=True, related_name='course_statements')
    student_policy = models.CharField(max_length=20, choices=POLICY_CHOICES, default='custom')
    allowed_uses = models.JSONField(default=list, blank=True)
    not_allowed_uses = models.JSONField(default=list, blank=True)
    cite_line = models.CharField(max_length=500, blank=True, default='')
    # The text as the professor last saved it, edits included.
    statement_text = models.TextField(blank=True, default='')
    student_text = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self) -> str:
        return f'{self.course_name} ({self.term})'
