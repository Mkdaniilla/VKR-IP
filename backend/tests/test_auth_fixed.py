from fastapi.testclient import TestClient
from app.main import create_app
from app.database import Base, engine

# Reset DB for the test (SQLite/dev)
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

app = create_app()
client = TestClient(app)

def test_register_login_me():
    email = "test@example.com"
    password = "secret123"

    r = client.post("/auth/register", json={"email": email, "password": password})
    assert r.status_code == 201, r.text

    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]

    # header auth
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == email

    # cookie auth
    cookies = {"access_token": token}
    r = client.get("/auth/me", cookies=cookies)
    assert r.status_code == 200
    assert r.json()["email"] == email
