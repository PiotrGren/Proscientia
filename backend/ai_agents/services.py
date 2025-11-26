import os
import pypdf
from openai import OpenAI
from django.conf import settings

def extract_text(file_path):
    """Wyciąga tekst z PDF. Ograniczamy do 5 stron dla szybkości MVP."""
    text = ""
    try:
        reader = pypdf.PdfReader(file_path)
        for i, page in enumerate(reader.pages):
            if i >= 5: break
            text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Błąd PDF: {e}")
    return text

def run_agent_summary(document_path):
    """Wysyła tekst do OpenAI."""
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    # 1. Pobierz tekst
    raw_text = extract_text(document_path)
    if not raw_text:
        return "Nie udało się odczytać tekstu z pliku."

    # 2. Skróć (bezpiecznik kosztowy)
    truncated_text = raw_text[:20000]

    # 3. Zapytanie do AI
    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL_NAME,
            messages=[
                {"role": "system", "content": "Jesteś inżynierem. Streszczaj dokumenty techniczne w punktach."},
                {"role": "user", "content": f"Dokument:\n{truncated_text}"}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Błąd OpenAI: {str(e)}"