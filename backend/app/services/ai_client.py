import httpx
import json
import os
from app.core.settings import settings


OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "dummy")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
AI_API_BASE = os.getenv("AI_API_BASE", "https://openrouter.ai/api/v1")

class OpenRouterClient:
    def __init__(self):
        self.api_key = OPENROUTER_API_KEY
        self.model = OPENROUTER_MODEL
        self.base = AI_API_BASE
        # Определяем, используем ли мы Google Gemini API
        self.is_gemini = "googleapis.com" in self.base

    async def complete(self, prompt: str, system_prompt: str = None):
        # Если ключ пустой, но мы используем бесплатный прокси (Pollinations), это ок
        if not self.api_key and "pollinations" not in self.base and not self.is_gemini:
            raise RuntimeError("OPENROUTER_API_KEY is not set in settings")

        print(f"DEBUG AI: Using model {self.model} at {self.base} (Gemini: {self.is_gemini})")
        
        async with httpx.AsyncClient(timeout=60) as client:
            try:
                if self.is_gemini:
                    # Google Gemini API format
                    url = f"{self.base}/models/{self.model}:generateContent?key={self.api_key}"
                    payload = {
                        "contents": [{
                            "parts": [{
                                "text": f"{system_prompt or 'You are a helpful assistant.'}\n\n{prompt}"
                            }]
                        }],
                        "generationConfig": {
                            "temperature": 0.1,
                        }
                    }
                    headers = {"Content-Type": "application/json"}
                else:
                    # OpenRouter API format
                    url = f"{self.base}/chat/completions"
                    payload = {
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt or "You are a professional legal assistant. Return ONLY a valid JSON object. No markdown, no explanations. Format: {\"answer\": \"string\", \"sources_used\": [int, ...]}"},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.1,
                    }
                    headers = {
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://mdmip.ru",
                        "X-Title": "MDM IP Management",
                    }

                resp = await client.post(url, headers=headers, json=payload)
                
                if resp.status_code != 200:
                    print(f"AI API Error Status: {resp.status_code}")
                    print(f"AI API Error Body: {resp.text}")
                    if resp.status_code == 429:
                        print("AI Status 429: Rate limit reached. Try again in a minute or switch to another free model.")
                    resp.raise_for_status()

                data = resp.json()
                
                # Парсим ответ в зависимости от API
                if self.is_gemini:
                    if "candidates" not in data or not data["candidates"]:
                        print(f"AI missing candidates: {data}")
                        raise RuntimeError("Invalid Gemini API response structure")
                    content = data["candidates"][0]["content"]["parts"][0]["text"]
                else:
                    if "choices" not in data or not data["choices"]:
                        print(f"AI missing choices: {data}")
                        raise RuntimeError("Invalid AI response structure")
                    content = data["choices"][0]["message"]["content"]
                
                print(f"DEBUG AI Response Content: {content[:200]}...")
                
                # Очистка от markdown блоков
                clean_content = content.strip()
                if "```" in clean_content:
                    start = clean_content.find("{")
                    end = clean_content.rfind("}")
                    if start != -1 and end != -1:
                        clean_content = clean_content[start:end+1]
                
                if "{" not in clean_content:
                    print(f"AI Error: Cleaned content is not JSON: {clean_content}")
                    raise json.JSONDecodeError("Missing {", clean_content, 0)

                return json.loads(clean_content)
            except Exception as e:
                print(f"AI Client Error: {str(e)}")
                raise e