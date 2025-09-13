# Fix фронта: npm/lock и "молчание" Next

**Проблема**  
`npm ci` рушится в Dockerfile: lock-файл не совпадает с package.json. Плюс в логах видно странную команду `next dev -p 3000w...` — значит в `package.json` скрипт `dev` повреждён.

**Что делает патч**  
1) В `frontend/Dockerfile` установка зависимостей переносится на **runtime** (во время запуска контейнера) — так мы используем ваш смонтированный `package.json` и не упираемся в конфликт lock-файла.  
2) В `docker-compose.yml` для `frontend` команда запуска:  
   ```sh
   sh -lc "npm install --no-audit --legacy-peer-deps && npm run dev -p 3000"
   ```
3) Чистый `frontend/package.json` со **скриптами без мусора** и закреплёнными версиями зависимостей.

## Применение

1. Скопируйте файлы из архива в проект (с заменой):
   - `frontend/Dockerfile`
   - `docker-compose.yml`
   - `frontend/package.json`

2. Удалите проблемный lock-файл на хосте (Windows PowerShell):
   ```powershell
   del .\frontend\package-lock.json -ErrorAction SilentlyContinue
   ```
   или на Linux/macOS:
   ```bash
   rm -f ./frontend/package-lock.json
   ```

3. Запустите заново:
   ```powershell
   docker compose down --volumes --remove-orphans
   docker compose up --build
   ```

4. Проверьте:
   - Откройте http://localhost:3000 — должна быть главная страница.
   - Перейдите на /register → создайте пользователя.
   - Перейдите на /login → войдите, попадёте на /dashboard (если добавляли страницы из предыдущего патча).

## Диагностика, если всё ещё "молчит"
- Посмотреть реальную команду и порт в контейнере:
  ```powershell
  docker exec -it vkrip-frontend-1 sh -lc "node -v && npm -v && cat package.json | sed -n '1,120p' && ss -lntp | grep 3000 || netstat -tlnp | grep 3000 || true"
  ```
- Проверить доступность API из контейнера фронта:
  ```bash
  docker exec -it vkrip-frontend-1 sh -lc "wget -qO- http://backend:8000/health || curl -s http://backend:8000/health"
  ```

## Примечания
- В dev режиме мы не фиксируем `NODE_ENV`, Next сам ставит нужное значение.  
- Для Windows/WSL оставлены `WATCHPACK_POLLING` и `CHOKIDAR_USEPOLLING` для стабильного HMR.  
- Для production используйте отдельный Dockerfile (multi-stage), `next build` + `next start` и `NODE_ENV=production`.
