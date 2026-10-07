"""Seed demo accounts, demo activities, an accepted-collab scenario, and one shared example.

Idempotent: safe to re-run. Updates existing rows by deterministic key
(email for users, name+owner for projects). Never deletes user-created data.

Demo accounts produced:
    demo.faculty@usf.edu  / TestPass123  (faculty role)
    demo.student@usf.edu  / TestPass123  (student role)

Scenarios produced (each idempotent):
    1. Faculty-owned activity, no collaborator, share_as_example=True
       → appears in Use Cases tab as a public example.
    2. Faculty-owned activity, student collaborator accepted
       → student sees this in their dashboard; both can comment.
    3. Student-owned activity, no advisor yet
       → demonstrates a student starting their own checklist.
    4. Pending invitation from faculty to a never-created email
       → demonstrates the pending state without polluting user accounts.

The specs and builders live in api.services.demo_seed so the per-visitor demo
endpoint can reuse them.
"""
from django.core.management.base import BaseCommand

from api.services.demo_seed import (
    DEMO_PASSWORD,
    FACULTY_EMAIL,
    STUDENT_EMAIL,
    seed_shared_demo_accounts,
)


class Command(BaseCommand):
    help = 'Seed demo accounts and demo activities for the TiE U pitch demo.'

    def handle(self, *args, **options) -> None:
        result = seed_shared_demo_accounts()
        self.stdout.write(self.style.SUCCESS(
            f'Demo users ready: {result.faculty.email}, {result.student.email}'
        ))
        self.stdout.write(self.style.SUCCESS(
            f'Activities ready: {result.public_activity.id}, '
            f'{result.shared_activity.id}, {result.student_activity.id}'
        ))
        self.stdout.write(self.style.SUCCESS('Demo data seeded.'))
        self.stdout.write('')
        self.stdout.write('Login credentials:')
        self.stdout.write(f'  Faculty: {FACULTY_EMAIL} / {DEMO_PASSWORD}')
        self.stdout.write(f'  Student: {STUDENT_EMAIL} / {DEMO_PASSWORD}')
