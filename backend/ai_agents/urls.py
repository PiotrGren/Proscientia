from django.urls import path
from .views import GenerateSummaryView

urlpatterns = [
    path('summarize/<int:doc_id>/', GenerateSummaryView.as_view()),
]