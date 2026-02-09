"""
Сервис для отображения документов с подсветкой рисков
"""
import re
from typing import Dict, List, Any
import mammoth


class DocumentHighlighter:
    """Конвертирует DOCX в HTML и подсвечивает риски"""
    
    # Паттерны рисков (из audit_agent.py)
    RISK_PATTERNS = {
        "unlimited_liability": {
            "keywords": [r"неограниченн\w*\s+ответственност", r"полн\w*\s+ответственност"],
            "severity": "critical",
            "title": "Неограниченная ответственность",
            "color": "#ef4444",  # red-500
            "recommendation": "Ограничьте ответственность конкретной суммой или процентом от стоимости договора. Добавьте пункт об ограничении ответственности форс-мажорными обстоятельствами."
        },
        "penalty_clause": {
            "keywords": [r"штраф", r"пен[ия]", r"неустойк"],
            "severity": "high",
            "title": "Штрафные санкции",
            "color": "#f97316",  # orange-500
            "recommendation": "Проверьте разумность размера штрафов (обычно не более 10% от суммы договора). Убедитесь, что есть возможность снижения неустойки судом согласно ст. 333 ГК РФ."
        },
        "exclusive_rights": {
            "keywords": [r"исключительн\w*\s+прав", r"передача\s+прав"],
            "severity": "high",
            "title": "Передача исключительных прав",
            "color": "#f59e0b",  # amber-500
            "recommendation": "Убедитесь, что передача прав оформлена письменно и зарегистрирована (если требуется). Проверьте, что вознаграждение соразмерно ценности прав. Рассмотрите вариант неисключительной лицензии вместо полной передачи."
        },
        "confidentiality": {
            "keywords": [r"конфиденциальн", r"коммерческ\w*\s+тайн", r"NDA"],
            "severity": "medium",
            "title": "Конфиденциальность",
            "color": "#eab308",  # yellow-500
            "recommendation": "Четко определите, какая информация является конфиденциальной. Установите разумный срок действия обязательства (обычно 3-5 лет). Предусмотрите исключения для общедоступной информации."
        },
        "termination": {
            "keywords": [r"расторжени", r"прекращени\w*\s+договор"],
            "severity": "medium",
            "title": "Условия расторжения",
            "color": "#84cc16",  # lime-500
            "recommendation": "Убедитесь, что процедура расторжения четко прописана. Предусмотрите разумный срок уведомления (обычно 30 дней). Определите порядок взаиморасчетов при расторжении."
        }
    }
    
    def convert_docx_to_html(self, file_path: str) -> str:
        """Конвертирует DOCX в HTML"""
        try:
            with open(file_path, "rb") as docx_file:
                result = mammoth.convert_to_html(docx_file)
                return result.value
        except Exception as e:
            raise Exception(f"Ошибка конвертации DOCX: {str(e)}")
    
    def highlight_risks(self, html_content: str) -> Dict[str, Any]:
        """
        Подсвечивает риски в HTML и возвращает:
        - highlighted_html: HTML с подсветкой
        - risks: список найденных рисков с позициями
        """
        risks_found = []
        highlighted_html = html_content
        
        # Обрабатываем каждый паттерн риска
        for risk_key, risk_info in self.RISK_PATTERNS.items():
            for pattern in risk_info["keywords"]:
                # Находим все совпадения
                matches = list(re.finditer(pattern, highlighted_html, re.IGNORECASE))
                
                # Обрабатываем с конца, чтобы не сбить индексы
                for match in reversed(matches):
                    start, end = match.span()
                    matched_text = highlighted_html[start:end]
                    
                    # Пропускаем, если уже внутри HTML-тега
                    if '<' in highlighted_html[max(0, start-50):start] and '>' not in highlighted_html[max(0, start-50):start]:
                        continue
                    
                    # Создаем уникальный ID для риска
                    current_risk_id = f"risk-{len(risks_found)}"
                    
                    # Добавляем в список рисков
                    # Берем контекст из чистого текста
                    plain_context = re.sub(r'<[^>]+>', '', highlighted_html[max(0, start-50):min(len(highlighted_html), end+50)])
                    
                    risks_found.append({
                        "id": current_risk_id,
                        "type": risk_key,
                        "title": risk_info["title"],
                        "severity": risk_info["severity"],
                        "text": matched_text,
                        "context": plain_context,
                        "recommendation": risk_info.get("recommendation", "Проконсультируйтесь с юристом для определения оптимального решения.")
                    })
                    
                    # Оборачиваем в mark с data-атрибутами
                    highlighted_part = (
                        f'<mark class="risk-highlight" '
                        f'data-risk-id="{current_risk_id}" '
                        f'data-severity="{risk_info["severity"]}" '
                        f'style="background-color: {risk_info["color"]}; '
                        f'color: white; padding: 2px 4px; border-radius: 3px; cursor: pointer;" '
                        f'title="{risk_info["title"]}">'
                        f'{matched_text}'
                        f'</mark>'
                    )
                    
                    highlighted_html = highlighted_html[:start] + highlighted_part + highlighted_html[end:]
        
        return {
            "html": highlighted_html,
            "risks": risks_found,
            "total_risks": len(risks_found)
        }
    
    
    def process_document(self, file_path: str) -> Dict[str, Any]:
        """Полный цикл: конвертация + подсветка"""
        html_content = self.convert_docx_to_html(file_path)
        result = self.highlight_risks(html_content)
        
        return {
            "html": result["html"],
            "risks": result["risks"],
            "total_risks": result["total_risks"],
            "severity_counts": self._count_by_severity(result["risks"])
        }
    
    def _count_by_severity(self, risks: List[Dict]) -> Dict[str, int]:
        """Подсчитывает риски по уровням серьезности"""
        counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for risk in risks:
            severity = risk.get("severity", "low")
            counts[severity] = counts.get(severity, 0) + 1
        return counts
