from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt
import os

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_change_me")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

def hash_password(p: str) -> str: return pwd.hash(p)
def verify_password(p: str, hp: str) -> bool: return pwd.verify(p, hp)

def create_access_token(sub: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": sub, "iat": int(now.timestamp()), "exp": int((now + timedelta(minutes=ACCESS_EXPIRE_MIN)).timestamp())}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
