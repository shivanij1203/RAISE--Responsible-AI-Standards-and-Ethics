from django.contrib import admin

from .models import (
    UserProfile,
    Project,
    Checkpoint,
    Decision,
    AITool,
    CheckpointComment,
)

admin.site.register(UserProfile)
admin.site.register(Project)
admin.site.register(Checkpoint)
admin.site.register(Decision)
admin.site.register(AITool)
admin.site.register(CheckpointComment)
