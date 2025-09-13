# Как применить комбинированный патч

1. Распакуйте архив в корень проекта, **сохраняя пути**. Он содержит:
   - backend/app/main.py
   - backend/app/core/security.py
   - backend/app/routers/auth.py
   - backend/app/schemas/user.py
   - backend/tests/test_auth_fixed.py
   - frontend/lib/api.ts
   - frontend/components/AuthForm.tsx
   - frontend/pages/login.tsx
   - frontend/pages/register.tsx
   - docker-compose.yml (dev-friendly)
   - frontend/Dockerfile (dev)

2. Проверьте `.env` в корне (или экспортируйте переменные окружения):
   ```
   DATABASE_URL=postgresql+psycopg2://postgres:postgres@db:5432/ip_guard
   SECRET_KEY=замени_на_случайный
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=10080
   ENV=dev
   CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. Пересоберите стек:
   ```
   docker compose down --volumes --remove-orphans
   docker compose up --build
   ```

4. Откройте фронт: http://localhost:3000  
   - Зарегистрируйтесь на /register
   - Войдите на /login
   - Проверьте, что cookie `access_token` появляется и запрос к `/auth/me` возвращает текущего пользователя.

> Для production используйте `next build` + `next start` и `NODE_ENV=production`, а также включите HTTPS и `secure` для cookie.
