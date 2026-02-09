import re
from docx import Document
from typing import List, Dict, Any

class LegalAuditAgent:
    """Локальный AI-агент для юридического аудита договоров и документов."""
    
    # Регулярные выражения для поиска зон риска
    RISK_PATTERNS = {
        "shady_penalties": {
            "title": "Завышенные штрафы",
            "keywords": [r"пеня в размере \d+", r"штраф в размере \d+", r"неустойка \d+%", r"более 0\.5%"],
            "severity": "high",
            "rec": "Снизьте размер пени до законного предела (обычно 0.1% в день) или привяжите к ключевой ставке ЦБ."
        },
        "ip_loss": {
            "title": "Потеря прав на ИС",
            "keywords": [r"права переходят в полном объеме", r"отчуждение прав", r"исключительное право переходит заказчику"],
            "severity": "critical",
            "rec": "Убедитесь, что переход прав происходит только после полной оплаты, или замените на лицензию."
        },
        "confidentiality_vague": {
            "title": "Размытая конфиденциальность",
            "keywords": [r"любая информация", r"в течение неограниченного срока", r"разглашение любыми способами"],
            "severity": "medium",
            "rec": "Уточните перечень конфиденциальной информации и установите разумный срок (например, 3-5 лет)."
        },
        "termination_trap": {
            "title": "Ловушка расторжения",
            "keywords": [r"без уведомления", r"в одностороннем внесудебном порядке без компенсации"],
            "severity": "high",
            "rec": "Добавьте пункт об обязательном уведомлении за 30 дней и компенсации фактически понесенных расходов."
        },
        "jurisdiction_risk": {
            "title": "Неудобная подсудность",
            "keywords": [r"по месту нахождения Истца", r"в Арбитражном суде г\. Москвы", r"по выбору Заказчика"],
            "severity": "low",
            "rec": "Попробуйте согласовать подсудность по месту вашего нахождения для экономии на юристах."
        }
    }

    def extract_text_from_docx(self, file_path: str) -> str:
        """Извлекает текст из документа DOCX."""
        doc = Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return "\n".join(full_text)

    async def analyze(self, file_path: str) -> Dict[str, Any]:
        """Проводит глубокий аудит текста с использованием LLM и Regex."""
        try:
            text = self.extract_text_from_docx(file_path)
            text_lower = text.lower()
            
            # 1. Regex анализ (быстрый)
            detected_risks = []
            recommendations = []
            
            for key, info in self.RISK_PATTERNS.items():
                found = False
                for pattern in info["keywords"]:
                    if re.search(pattern, text_lower):
                        found = True
                        break
                
                if found:
                    detected_risks.append({
                        "id": key,
                        "title": info["title"],
                        "severity": info["severity"],
                        "description": f"В документе обнаружены формулировки, попадающие под категорию '{info['title'].lower()}'."
                    })
                    recommendations.append({
                        "icon": "⚠️" if info["severity"] == "critical" else "💡",
                        "text": info["rec"]
                    })

            # 2. LLM анализ (глубокий)
            from app.services.legal_ai import analyze_document_text
            llm_result = await analyze_document_text(text)
            
            # Объединяем результаты.
            # ВАЖНО: Frontend (ip-objects.tsx) ожидает, что у рисков есть 'title', а у рекомендаций 'text'.
            # Если этих полей нет, он пытается отрендерить сам объект, из-за чего React падает (Error #31).
            # Поэтому мы принудительно формируем правильную структуру.
            
            def safe_str(val) -> str:
                if isinstance(val, dict):
                    return str(val.get("title") or val.get("text") or val.get("value") or val)
                return str(val)

            final_risks = []
            # 1. Regex риски (уже имеют title)
            final_risks.extend(detected_risks)
            
            # 2. LLM риски
            for r in llm_result.get("risks", []):
                final_risks.append({
                    "title": safe_str(r),
                    "severity": "medium", 
                    "description": "Выявлено ИИ"
                })

            final_recs = []
            # 1. Regex рекомендации (уже имеют text)
            final_recs.extend(recommendations)
            
            # 2. LLM рекомендации
            for r in llm_result.get("improvements", []):
                final_recs.append({
                    "icon": "🤖",
                    "text": safe_str(r)
                })
            
            summary = llm_result.get("summary", f"Анализ завершен. Проверено {len(text.split())} слов.")

            return {
                "summary": summary,
                "risks": final_risks,
                "recommendations": final_recs,
                "confidence": 0.95
            }
        except Exception as e:
            return {
                "error": f"Не удалось проанализировать файл: {str(e)}",
                "summary": "Ошибка при чтении документа.",
                "risks": [],
                "recommendations": []
            }
