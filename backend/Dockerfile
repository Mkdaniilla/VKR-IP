FROM python:3.11-slim

# Установка curl (и других утилит при необходимости)
RUN apt-get update && apt-get install -y curl

# Установка рабочей директории
WORKDIR /app

# Копируем всё из корня проекта (включая app/, requirements.txt и т.д.)
COPY . /app

# ✅ Явно добавляем шрифты (чтобы DejaVuLGCSans.ttf точно попал в образ)
COPY ./app/static/fonts /app/static/fonts

# Установка зависимостей
RUN pip install --no-cache-dir -r requirements.txt

# Команда запуска
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
