from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny  # <--- IMPORT 1
from django.shortcuts import get_object_or_404
from django.conf import settings                    # do agenta wiedzy
from pgvector.django import L2Distance              # do agenta wiedzy (do szukania wektorów)
from openai import OpenAI                           # do agenta wiedzy
from documents.models import Document
from .tasks import generate_summary_task, generate_erp_mes_latest_report_task, process_document_indexing_task
from rest_framework.permissions import IsAuthenticated
from .services import count_user_summaries_for_document, get_embedding # get_embediing do agenta wiedzy
from rest_framework import generics, permissions
from .models import AiArtifact, DocumentChunk # DocumentChunk to do agenta wiedzy - do kontekstu
from .serializers import AiArtifactSerializer


class AiArtifactListView(generics.ListAPIView):
    """
    GET /api/agents/artifacts/?type=summary

    Zwraca listę artefaktów zalogowanego użytkownika.
    Opcjonalny parametr `type` filtruje po polu `artifact_type`
    (np. "summary", "quiz").
    """
    serializer_class = AiArtifactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = AiArtifact.objects.filter(owner=user)
        type_param = self.request.query_params.get("type")
        if type_param:
            qs = qs.filter(artifact_type=type_param)
        return qs


class AiArtifactDetailView(generics.RetrieveDestroyAPIView):
    """
    GET /api/agents/artifacts/<id>/
    DELETE /api/agents/artifacts/<id>/

    Używane przez frontend do usuwania streszczeń.
    Dostęp tylko do artefaktów bieżącego użytkownika.
    """
    serializer_class = AiArtifactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AiArtifact.objects.filter(owner=self.request.user)

class TriggerIndexingView(APIView):
    """
    POST /api/agents/index/<doc_id>/
    Ręczne wymuszenie indeksowania (RAG).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, doc_id):
        # Sprawdzamy czy dokument istnieje i należy do usera (lub user jest adminem)
        # (W MVP upraszczamy - każdy zalogowany może indeksować)
        try:
             doc = Document.objects.get(pk=doc_id)
        except Document.DoesNotExist:
             return Response({"detail": "Not found"}, status=404)
        
        task = process_document_indexing_task.delay(doc.id)
        
        return Response({
            "message": "Rozpoczęto indeksowanie RAG.",
            "task_id": task.id,
            "doc_id": doc.id
        }, status=status.HTTP_202_ACCEPTED)

class TriggerSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, doc_id):
        user = request.user

        # 1) Pobierz dokument
        doc = get_object_or_404(Document, pk=doc_id)

        # 2) Sprawdź, czy user ma prawo do dokumentu:
        #    - mockowe (MOCK_*) są globalnie dostępne
        #    - USER_UPLOAD tylko jeśli uploaded_by=user
        if doc.source == Document.SOURCE_USER_UPLOAD:
            if doc.uploaded_by_id != user.id:                               # type: ignore
                return Response(
                    {"detail": "Nie masz dostępu do tego pliku."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # 3) Limit 3 streszczeń na dokument per user
        if count_user_summaries_for_document(user, doc) >= 3:
            return Response(
                {"detail": "Limit 3 streszczeń dla tego pliku został przekroczony."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4) Opcjonalny 'scope' (na przyszłego DocSearch)
        scope = request.data.get("scope")

        # 5) Uruchomienie Celery Task z user_id i scope
        task = generate_summary_task.delay(doc.id, user.id, scope)          # type: ignore

        return Response({
            "message": "Zadanie przyjęte do realizacji.",
            "task_id": task.id,
            "document_id": doc.id,                                          # type: ignore
            "websocket_url": "/ws/notifications/",
        }, status=status.HTTP_202_ACCEPTED)


class ErpMesQuickReportView(APIView):
    """
    POST /api/agents/erp-mes/latest-report/

    Uruchamia agenta generującego szybki raport z najnowszych snapshotów ERP/MES.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        scope = request.data.get("scope")  # opcjonalnie, pod DocSearch w przyszłości

        task = generate_erp_mes_latest_report_task.delay(user.id, scope)        # type: ignore

        return Response(
            {
                "message": "Zadanie raportu ERP/MES przyjęte do realizacji.",
                "task_id": task.id,
                "websocket_url": "/ws/notifications/",
            },
            status=status.HTTP_202_ACCEPTED,
        )


# ---- Agent wiedzy

class AskDocumentView(APIView):
    """
    POST /api/agents/ask/<doc_id>/
    
    Agent Wiedzy (QA):
    1. Zamienia pytanie usera na wektor.
    2. Szuka 5 najbliższych fragmentów w tabeli DocumentChunk.
    3. Generuje odpowiedź przy użyciu GPT-4o-mini.
    """
    permission_classes = [IsAuthenticated] # Wymaga tokena (jak reszta systemu)

    def post(self, request, doc_id):
        # 1. Walidacja wejścia
        question = request.data.get("question")
        if not question:
            return Response({"detail": "Brak pytania (pole 'question')."}, status=400)

        # 2. Pobranie dokumentu (i sprawdzenie uprawnień - uproszczone dla MVP)
        doc = get_object_or_404(Document, pk=doc_id)

        # 3. Zamiana pytania na wektor (Embedding)
        query_vector = get_embedding(question)
        if not query_vector:
            return Response(
                {"detail": "Nie udało się przetworzyć pytania (błąd OpenAI API)."}, 
                status=503
            )

        # 4. Wyszukiwanie Semantyczne (RAG)
        # Dla długich dokumentów pobieramy 5 najlepszych fragmentów.
        # Używamy L2Distance (odległość euklidesowa) - im mniejsza, tym lepsze dopasowanie.
        chunks = DocumentChunk.objects.filter(document=doc).annotate(
            distance=L2Distance('embedding', query_vector)
        ).order_by('distance')[:5]

        if not chunks:
            return Response(
                {
                    "answer": "Ten dokument nie został jeszcze zindeksowany. Użyj endpointu /index/ aby przygotować go do wyszukiwania.",
                    "sources": []
                }, 
                status=400
            )

        # 5. Budowanie Kontekstu (Sklejamy fragmenty w jeden tekst)
        context_text = "\n\n---\n\n".join([chunk.text_content for chunk in chunks])

        # 6. Prompt Engineering (Instrukcja dla modelu)
        system_prompt = (
            "Jesteś precyzyjnym asystentem inżyniera produkcji. "
            "Odpowiadaj na pytania WYŁĄCZNIE na podstawie dostarczonego poniżej KONTEKSTU. "
            "Jeśli w kontekście nie ma odpowiedzi, napisz: 'Niestety, dokument nie zawiera informacji na ten temat.' "
            "Nie wymyślaj faktów. Odpowiedź powinna być zwięzła i w języku polskim."
        )
        
        user_message = f"Pytanie: {question}\n\nKONTEKST:\n{context_text}"

        # 7. Zapytanie do GPT
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-4o-mini",  # Szybki i tani model, idealny do RAG
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.0  # Zero kreatywności = maksymalna wierność dokumentowi
            )
            
            answer = response.choices[0].message.content

            # Zwracamy odpowiedź oraz źródła (dla weryfikacji przez człowieka)
            return Response({
                "answer": answer,
                "sources": [c.text_content[:200] + "..." for c in chunks] # Podgląd pierwszych 200 znaków każdego fragmentu
            })

        except Exception as e:
            return Response({"detail": str(e)}, status=500)