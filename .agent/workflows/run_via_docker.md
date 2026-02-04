---
description: Run VKR IP project using Docker Compose
---

**Prerequisites**
- Docker Engine installed (>=20.10)
- Docker Compose (v2) installed

**Steps**
1. Open a terminal in the project root (`c:\Users\mkdan\Desktop\VKR IP`).
2. Build and start all services:
   ```
   docker compose up --build -d
   ```
   // turbo
3. Verify that the backend is healthy (wait ~10 s, then run):
   ```
   curl -f http://localhost:8000/health
   ```
   It should return `{"ok":true}`.
4. Open the frontend in a browser at `http://localhost:3000`.
5. To stop the containers:
   ```
   docker compose down
   ```

**Notes**
- The `docker-compose.yml` defines three services: `db`, `backend`, and `frontend`.
- The backend service maps port **8000** to the host, and the frontend maps **3000**.
- Volumes are mounted so code changes are reflected without rebuilding (except for dependency changes).
- If you modify `backend/Dockerfile` or `frontend/Dockerfile`, repeat step 2 to rebuild.
