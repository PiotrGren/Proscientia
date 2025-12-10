from django.contrib import admin
from .models import AiSummary

@admin.register(AiSummary)
class AiSummaryAdmin(admin.ModelAdmin):
    list_display = ['document', 'created_at']