from django.db import models
from documents.models import Document

class AiSummary(models.Model):
    document = models.OneToOneField(Document, on_delete=models.CASCADE, related_name='ai_summary')
    summary_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Summary for {self.document.id}"