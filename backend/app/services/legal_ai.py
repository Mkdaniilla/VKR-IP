from app.services.ai_client import OpenRouterClient
import logging
import httpx

logger = logging.getLogger(__name__)

async def get_legal_customization(template: str, ip_title: str, counterparty_name: str, owner_name: str):
    """
    Использует ИИ для генерации специфических юридических формулировок
    для предмета договора или условий претензии.
    """
    client = OpenRouterClient()
    
    prompts = {
        "nda": f"Сгенерируй условия для NDA по объекту '{ip_title}' между '{owner_name}' и '{counterparty_name}'. Верни JSON с ключами: 'subject' (Предмет соглашения, подробное описание), 'confidential_info' (Определение конфиденциальной информации для этого объекта), 'obligations' (Обязательства по неразглашению).",
        "assignment": f"Сгенерируй условия Договора об отчуждении (продаже) исключительного права на '{ip_title}' от '{owner_name}' к '{counterparty_name}'. Верни JSON с ключами: 'subject' (Полное отчуждение прав), 'consideration' (Условия оплаты и вознаграждения), 'warranties' (Гарантии чистоты прав).",
        "license": f"Сгенерируй условия Лицензионного договора для '{ip_title}'. Верни JSON с ключами: 'scope' (Способы использования: воспроизведение, распространение и т.д.), 'territory' (Территория использования), 'term' (Срок действия).",
        "pretension": f"Сгенерируй текст Досудебной претензии о нарушении прав на '{ip_title}' со стороны '{counterparty_name}'. Верни JSON с ключами: 'infringement_desc' (Описание нарушения), 'legal_ground' (Правовое обоснование, статьи ГК РФ), 'demands' (Требования: прекратить нарушение, выплатить компенсацию).",
        "isk": f"Сгенерируй текст Искового заявления о защите прав на '{ip_title}'. Верни JSON с ключами: 'claims' (Исковые требования), 'facts' (Фактические обстоятельства), 'justification' (Правовое обоснование).",
        "franchise": f"Сгенерируй условия Договора коммерческой концессии (франчайзинга) для '{ip_title}' между '{owner_name}' и '{counterparty_name}'. Верни JSON с ключами: 'subject' (Предмет договора), 'scope' (Предоставляемые права), 'territory' (Территория), 'term' (Срок действия), 'consideration' (Вознаграждение).",
        "pledge": f"Сгенерируй условия Договора залога исключительного права на '{ip_title}'. Верни JSON с ключами: 'subject' (Предмет залога), 'secured_obligation' (Обеспечиваемое обязательство), 'valuation' (Оценка предмета залога), 'pledgor_obligations' (Обязательства залогодателя).",
        "notice": f"Сгенерируй текст Уведомления о нарушении исключительного права на '{ip_title}' для '{counterparty_name}'. Верни JSON с ключами: 'infringement_desc' (Описание нарушения), 'legal_ground' (Правовое обоснование), 'demands' (Требования к нарушителю).",
    }

    prompt = prompts.get(template, f"Сгенерируй профессиональный юридический текст для документа типа '{template}' по объекту '{ip_title}'. Верни JSON с ключом 'main_text'.")
    
    system_instruction = (
        "Ты — профессиональный юрист по интеллектуальной собственности в РФ."
        "Верни строго валидный JSON объект. Ключи должны соответствовать запросу (например, 'subject', 'conditions' и т.д.)."
        "Значения должны быть профессиональными юридическими формулировками НА РУССКОМ ЯЗЫКЕ."
        "Не используй маркдаун (**bold**, ## заголовки). Только чистый текст."
    )
    
    try:
        # Pass system_instruction as separate argument
        result = await client.complete(prompt, system_prompt=system_instruction)
        # Ensure result is a dict (client already parses JSON)
        if isinstance(result, dict):
             # Fallback if keys are missing or simple answer returned
             if "answer" in result and len(result) == 1:
                 return {"main_text": result["answer"]}
             return result
        return {"main_text": str(result)}

    except Exception as e:
        logger.error(f"Legal AI Error: {e}")
        return {"main_text": "Ошибка генерации ИИ-контента."}

async def analyze_document_text(text: str):
    """
    Анализирует текст документа на наличие юридических рисков.
    """
    client = OpenRouterClient()
    prompt = f"Проанализируй текст юридического документа на наличие рисков для правообладателя. Выдели 3 ключевых риска и 3 рекомендации по улучшению. Текст документа:\n\n{text[:2500]}"
    
    system_instruction = "Ты — профессиональный юрист по интеллектуальной собственности в РФ. Верни ответ строго в формате JSON: {\"risks\": [\"строка (на русском)\", ...], \"improvements\": [\"строка (на русском)\", ...], \"summary\": \"краткое резюме на русском\"}"
    
    try:
        # FIX: Pass system_prompt as argument properly
        result = await client.complete(prompt, system_prompt=system_instruction)
        
        # Validate result structure
        if not isinstance(result, dict):
            raise ValueError("AI returned non-dict response")
        
        # Ensure all required keys exist
        if "risks" not in result:
            result["risks"] = ["Не удалось провести полный анализ рисков"]
        if "improvements" not in result:
            result["improvements"] = ["Рекомендуется провести ручную проверку документа юристом"]
        if "summary" not in result:
            result["summary"] = "Автоматический анализ не завершен"
            
        return result
        
    except httpx.HTTPStatusError as e:
        logger.error(f"Legal Audit HTTP Error: {e.response.status_code} - {e.response.text}")
        
        # Specific handling for different HTTP errors
        if e.response.status_code == 402:
            error_msg = "Превышен лимит API. Анализ временно недоступен."
        elif e.response.status_code == 429:
            error_msg = "Слишком много запросов. Попробуйте через минуту."
        else:
            error_msg = f"Ошибка сервиса анализа (код {e.response.status_code})"
            
        return {
            "risks": [error_msg, "Рекомендуется провести ручную проверку документа"],
            "improvements": [
                "Обратитесь к юристу для детального анализа",
                "Проверьте соответствие документа требованиям законодательства РФ",
                "Убедитесь в наличии всех необходимых реквизитов и подписей"
            ],
            "summary": f"Автоматический анализ недоступен: {error_msg}. Документ требует ручной проверки юристом."
        }
        
    except Exception as e:
        logger.error(f"Legal Audit Error: {e}")
        return {
            "risks": [
                "Не удалось провести автоматический анализ",
                "Рекомендуется ручная проверка юристом"
            ],
            "improvements": [
                "Проверьте наличие всех обязательных реквизитов",
                "Убедитесь в корректности юридических формулировок",
                "Сверьте документ с актуальным законодательством РФ"
            ],
            "summary": "Автоматический анализ временно недоступен. Для полной проверки обратитесь к квалифицированному юристу."
        }
