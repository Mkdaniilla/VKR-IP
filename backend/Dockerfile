FROM m.daocloud.io/docker.io/library/python:3.11-slim

# Настройки Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Установка системных зависимостей
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем requirements первым для использования кэша Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем остальной код
COPY . .

# Явно копируем шрифты
COPY ./app/static/fonts /app/static/fonts

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
