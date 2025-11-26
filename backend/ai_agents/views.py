from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from documents.models import Document
from .models import AiSummary
from .services import run_agent_summary

class GenerateSummaryView(APIView):
    # Wyłączamy autoryzację dla szybkich testów (MVP)
    permission_classes = [] 

    def post(self, request, doc_id):
        # 1. Pobierz dokument
        doc = get_object_or_404(Document, pk=doc_id)
        
        if not doc.file:
            return Response({"error": "Brak pliku fizycznego"}, status=400)

        # 2. Uruchom agenta (ścieżka pliku w kontenerze)
        # Uwaga: to zajmie 5-10 sekund (synchronicznie)
        summary_content = run_agent_summary(doc.file.path)

        # 3. Zapisz wynik
        AiSummary.objects.update_or_create(
            document=doc,
            defaults={"summary_text": summary_content}
        )

        return Response({
            "status": "success",
            "document": doc.title,
            "summary": summary_content
        })