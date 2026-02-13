# VKR IP - Система управления и оценки интеллектуальной собственности

Премиальная LegalTech платформа для автоматизированного учета, юридического аудита и финансовой оценки объектов интеллектуальной собственности (ИС).

## 🚀 Основные возможности

- **Dashboard**: Интеллектуальный обзор состояния портфеля ИС.
- **AI Valuation**: Профессиональная оценка активов по международным стандартам с помощью "Матрешка AI".
- **Deadlines Control**: Ситуационный центр для мониторинга критических дат и уплаты пошлин.
- **Knowledge Base**: Умный навигатор по юридическим и техническим вопросам.
- **Document Management**: Защищенное хранилище и аудит документов.
- **Cyber-Legal UI**: Современный интерфейс в стиле "Cyber Luxury" с использованием Glassmorphism и Lucide иконок.

## 🛠 Технологический стек

### Frontend
- **Framework**: Next.js 15
- **Styling**: Tailwind CSS, Vanilla CSS (Glassmorphism)
- **Icons**: Lucide React
- **Charts**: Recharts

### Backend
- **Core**: FastAPI (Python 3.11)
- **Database**: PostgreSQL / SQLAlchemy 2.0
- **AI**: Local AI Agents (LLM integration)
- **Tasks**: APScheduler

## 📦 Быстрый запуск

### С помощью Docker (Рекомендуется)
```bash
docker-compose up --build
```
Доступ к приложению:
- Frontend: `http://localhost:3000`
- API Backend: `http://localhost:8000/api`
- API Docs: `http://localhost:8000/api/docs`

### Локальная разработка

#### Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

## 📂 Структура проекта

- `/frontend`: Приложение Next.js
- `/backend`: API на FastAPI
- `/docker-compose.yml`: Конфигурация для развертывания
- `/backend/app/routers`: Логика эндпоинтов
- `/backend/app/services`: AI агенты и движок оценки
