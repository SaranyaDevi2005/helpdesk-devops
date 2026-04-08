from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import UserRegister, UserLogin
from database import users_col
import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── AUTH ──────────────────────────────────────────

@app.post("/register")
def register(user: UserRegister):
    if users_col.find_one({"username": user.username}):
        raise HTTPException(400, "Username already exists")

    hashed = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt())

    users_col.insert_one({
        "username": user.username,
        "password": hashed,
        "email": user.email,
        "user_type": user.user_type,
        "department": user.department,
        "role": user.role,
        "employee_id": user.employee_id
    })

    return {"message": "Registered successfully"}


@app.post("/login")
def login(user: UserLogin):
    db_user = users_col.find_one({"username": user.username})

    if not db_user or not bcrypt.checkpw(user.password.encode(), db_user["password"]):
        raise HTTPException(401, "Invalid credentials")

    token_data = {
        "sub": db_user["username"],
        "user_type": db_user["user_type"],
        "role": db_user["role"],
        "department": db_user.get("department"),
        "employee_id": db_user.get("employee_id")
    }
    access_token = create_token(token_data)
    return {
        "access_token": access_token,
        "username": token_data["sub"],
        "user_type": token_data["user_type"],
        "role": token_data["role"],
        "department": token_data["department"],
        "employee_id": token_data["employee_id"]
    }


@app.get("/health")
def health():
    return {"status": "ok"}
