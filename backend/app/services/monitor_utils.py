import re
from typing import Iterable, List, Dict
from random import random

def gen_queries(name: str) -> List[str]:
    base = name.strip()
    variants = {base, base.lower(), base.replace(" ", ""), base.replace("-", " ")}
    # грубая транслитерация кириллицы в похожие латинские символы (MVP)
    variants.add(base.translate(str.maketrans("АВЕКМНОРСТХ", "ABEKMHOPCTX")))
    return list(variants)

def _ngrams(s: str, n: int = 3) -> set[str]:
    s = re.sub(r"[^a-zA-Z0-9а-яА-Я]+", "", s.lower())
    return {s[i:i+n] for i in range(max(len(s)-n+1, 1))}

def score_text(q: str, *fields: str) -> float:
    A = _ngrams(q)
    B = set()
    for f in fields:
        B |= _ngrams(f or "")
    inter = len(A & B); union = len(A | B)
    return round(inter/union if union else 0.0, 4)

# --- заглушки парсеров (вернём 2 "вменяемых" результата для демонстрации) ---
def fetch_wb(queries: Iterable[str]) -> List[Dict]:
    q = next(iter(queries), "")
    return [
        {"source":"wb","id":"wb-demo-1","url":"https://www.wildberries.ru/","title":f"{q} футболка", "seller":"Demo WB", "price":1499, "image_url":None, "q":q},
    ]

def fetch_ozon(queries: Iterable[str]) -> List[Dict]:
    q = next(iter(queries), "")
    return [
        {"source":"ozon","id":"ozon-demo-1","url":"https://www.ozon.ru/","title":f"Набор с логотипом {q}", "seller":"Demo Ozon", "price":2299, "image_url":None, "q":q},
    ]

def fetch_runet(queries: Iterable[str]) -> List[Dict]:
    q = next(iter(queries), "")
    return [
        {"source":"runet","id":"site-demo-1","url":"https://example.com","title":f"Бренд {q} — обзор", "seller":"Example", "price":None, "image_url":None, "q":q},
    ]

def score_image(logo_path: str | None, image_url: str | None) -> float:
    # пока без CLIP — имитируем «нет картинки»
    return 0.0
