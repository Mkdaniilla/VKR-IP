# app/services/linkmark_client.py
import hashlib
import base64
import requests
from typing import Dict, Any, List

GARDIUM_URL = "https://prod-api.gardium.ru/_search"

HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json; charset=UTF-8",
    "Origin": "https://brand-search.ru",
    "Referer": "https://brand-search.ru/",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/118.0 Safari/537.36"
    ),
}


def calc_sha1_base64(text: str) -> str:
    """
    Генерирует SHA1-хэш в формате base64 точно как на brand-search.ru.
    Важно: кодировка UTF-8 без BOM, без пробелов вокруг текста.
    """
    cleaned = text.strip().encode("utf-8")
    sha1_bytes = hashlib.sha1(cleaned).digest()
    return base64.b64encode(sha1_bytes).decode("utf-8")


def search_trademarks(query_text: str) -> List[Dict[str, Any]]:
    """
    Поиск товарных знаков через API Gardium (prod-api.gardium.ru/_search).
    """
    if not query_text or not query_text.strip():
        print("[GARDIUM_PARSER] Пустой поисковый запрос.")
        return []

    query_text = query_text.strip()
    sha1hash = calc_sha1_base64(query_text)

    payload = {
        "text": query_text,
        "gsNumber": [],
        "SHA1hash": sha1hash,
    }

    try:
        resp = requests.post(GARDIUM_URL, json=payload, headers=HEADERS, timeout=20)
        # Проверим тело на случай, если сервер возвращает HTML-ошибку
        if resp.status_code != 200:
            print(f"[GARDIUM_PARSER] Ошибка {resp.status_code}: {resp.text[:300]}")
            resp.raise_for_status()

        data = resp.json()
    except Exception as e:
        print(f"[GARDIUM_PARSER] Ошибка при запросе: {e}")
        return []

    # Gardium возвращает {"data": [...]} или {"items": [...]}
    items = data.get("data") or data.get("items") or []
    results: List[Dict[str, Any]] = []

    for item in items:
        results.append({
            "title": item.get("markName") or item.get("name") or "",
            "classes": item.get("mktu") or [],
            "owner": item.get("rightHolder") or "",
            "status": item.get("status") or "",
            "registration_number": item.get("regNumber") or "",
            "application_number": item.get("appNumber") or "",
            "image_url": item.get("imgPath") or "",
            "publication_date": item.get("publicationDate") or "",
        })

    print(f"[GARDIUM_PARSER] Найдено {len(results)} совпадений по запросу '{query_text}'")
    if results:
        print("Примеры:", [
            {"title": r["title"], "owner": r["owner"], "status": r["status"]}
            for r in results[:3]
        ])
    return results


HIGH_RISK_STATUSES = {"зарегистрирован", "registered", "действует", "Высокий риск"}


def assess_risk(records: List[Dict[str, Any]]) -> str:
    """
    Эвристическая оценка риска отказа в регистрации.
    """
    if not records:
        return "low"
    if len(records) >= 5:
        return "high"
    for rec in records:
        if str(rec.get("status", "")).lower() in HIGH_RISK_STATUSES:
            return "high"
    return "medium"

