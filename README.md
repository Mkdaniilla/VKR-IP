# VKR-IP

`VKR-IP` — веб-система для учета, анализа и оценки объектов интеллектуальной собственности. Проект объединяет реестр объектов ИС, модуль стоимостной оценки, генерацию документов, базу знаний и контроль дедлайнов в одном интерфейсе.

## Что умеет система

- вести реестр объектов интеллектуальной собственности;
- хранить связанные документы и материалы;
- рассчитывать стоимость объектов ИС с использованием `Relief from Royalty` и `DCF`;
- формировать PDF-отчеты по результатам оценки;
- генерировать типовые юридические документы;
- отображать аналитику и обзорные показатели на dashboard;
- поддерживать базу знаний по тематике ИС;
- работать с дедлайнами и связанными сущностями проекта.

## Архитектура

Проект состоит из трех основных частей:

- `frontend` — клиентская часть на `Next.js 15` и `React 19`;
- `backend` — серверная часть на `FastAPI`, `SQLAlchemy`, `Pydantic`;
- `PostgreSQL` — основная база данных.

Для локального и production-запуска используются `Docker` и `Docker Compose`. На сервере production-окружение работает через `Nginx`.

## Технологический стек

- Frontend: `Next.js 15`, `React 19`, `TypeScript`, `Tailwind CSS`, `Recharts`, `Lucide React`
- Backend: `FastAPI`, `Python 3.11`, `SQLAlchemy 2.0`, `Pydantic`, `Alembic`
- Database: `PostgreSQL 15`
- Reporting: `reportlab`, `docxtpl`
- AI integration: `OpenRouter`
- Infrastructure: `Docker`, `Docker Compose`, `Nginx`

## Структура репозитория

- `frontend/` — клиентская часть приложения
- `frontend/pages/` — основные страницы интерфейса
- `frontend/components/` — UI-компоненты и компоненты бизнес-логики
- `backend/` — backend-часть проекта
- `backend/app/routers/` — API-маршруты
- `backend/app/services/` — сервисная логика, включая модуль оценки и генерацию отчетов
- `backend/app/models/` — модели базы данных
- `backend/app/schemas/` — схемы API и валидации
- `docs/` — дополнительные материалы проекта
- `TECHNICAL_SPECIFICATION.md` — актуальное текстовое техническое задание на русском языке

## Основные страницы и модули

Во frontend присутствуют следующие ключевые разделы:

- `/dashboard` — сводная аналитика
- `/ip-objects` — реестр объектов ИС
- `/valuation` — модуль оценки
- `/DocumentManager` — работа с документами
- `/knowledge` — база знаний
- `/deadlines` — дедлайны
- `/counterparties` — контрагенты
- `/login`, `/register` — авторизация

В backend присутствуют маршруты:

- `valuation`
- `documents`
- `ip`
- `ip_objects`
- `knowledge`
- `deadlines`
- `counterparties`
- `monitoring`
- `auth`
- `videos`

## Локальный запуск через Docker

Для локального запуска используется файл `docker-compose.yml`.

### 1. Подготовка переменных окружения

Скопируйте шаблоны и заполните значения:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Минимально необходимо задать:

- `DB_PASSWORD`
- `DATABASE_URL`
- `SECRET_KEY`
- `OPENROUTER_API_KEY`

### 2. Запуск

```bash
docker-compose up --build -d
```

### 3. Доступ

- frontend: `http://localhost:3000`
- backend: `http://localhost:8000`
- backend docs: `http://localhost:8000/docs`

## Локальный запуск без Docker

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Для Linux/macOS:

```bash
source .venv/bin/activate
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Production

Для production-конфигурации в проекте используется `docker-compose.prod.yml`.

Важно:

- production-окружение на сервере использует отдельные переменные окружения;
- в репозитории не должны храниться рабочие секреты, токены и реальные `.env`-файлы;
- текущий репозиторий хранит только шаблоны окружения, очищенные от чувствительных данных.

Production-домен проекта:

- `https://mdmip.ru`

## Модуль оценки

Система оценки использует комбинированную логику:

- доходный подход через `Relief from Royalty`;
- дисконтирование денежных потоков (`DCF`);
- затратный подход как дополнительный ориентир;
- корректировки на юридические факторы, интервью и подтверждающие материалы;
- формирование диапазона значений `min / base / max`.

Основные файлы модуля:

- `backend/app/services/valuation_engine.py`
- `backend/app/services/valuation_report.py`
- `backend/app/routers/valuation.py`
- `frontend/pages/valuation/index.tsx`
- `frontend/components/ValuationChat.tsx`

## Документы и отчеты

Система поддерживает:

- генерацию документов по объектам ИС;
- хранение документов, связанных с объектом;
- формирование PDF-отчета по результатам оценки.

## Текущее состояние репозитория

Репозиторий приведен в актуальное состояние относительно production-кода проекта, но с важным отличием:

- код приложения синхронизирован с серверной версией;
- чувствительные данные, `.env`-файлы и служебные серверные артефакты из репозитория удалены;
- `README` и `TECHNICAL_SPECIFICATION.md` приведены в читаемый вид для сопровождения проекта.

## Что стоит учитывать

- старые бинарные документы `Technical_Specification_VKR_IP.docx` и `Technical_Specification_VKR_IP_v2.doc` остаются в репозитории как архивные материалы;
- актуальной текстовой версией ТЗ считается `TECHNICAL_SPECIFICATION.md`;
- если проект разворачивается на новом сервере, production-переменные окружения нужно задавать заново.
