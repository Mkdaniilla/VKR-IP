# app/services/ai_suggestions.py
import os
import httpx
from typing import Dict

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "deepseek/deepseek-r1:free"


def suggest_mark_description(mark_name: str) -> Dict:
    """
    Генерация описания товарного знака через OpenRouter (DeepSeek R1 free).
    """
    if not OPENROUTER_API_KEY:
        # fallback если ключа нет
        return {
            "verbal": f"Словесное обозначение '{mark_name}' выполнено заглавными буквами.",
            "graphic": "Если есть логотип — опишите форму, композицию и линии.",
            "colors": "Используется монохромный вариант (чёрный/белый).",
            "symbolism": "Ассоциации: надежность, скорость, профессионализм.",
        }

    prompt = f"""
    Ты эксперт по интеллектуальной собственности.
    Составь краткое описание товарного знака "{mark_name}" по структуре:
    1. Словесное обозначение
    2. Графический элемент
    3. Цвета
    4. Символизм (ассоциации)
    """

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "Ты юрист по товарным знакам."},
            {"role": "user", "content": prompt},
        ],
    }

    try:
        with httpx.Client(timeout=60) as client:
            r = client.post(OPENROUTER_URL, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
            content = data["choices"][0]["message"]["content"]

        # простая пост-обработка
        return {
            "verbal": content.split("1.")[1].split("2.")[0].strip() if "1." in content else content,
            "graphic": content.split("2.")[1].split("3.")[0].strip() if "2." in content else "",
            "colors": content.split("3.")[1].split("4.")[0].strip() if "3." in content else "",
            "symbolism": content.split("4.")[1].strip() if "4." in content else "",
        }
    except Exception as e:
        return {"error": f"AI request failed: {e}"}
