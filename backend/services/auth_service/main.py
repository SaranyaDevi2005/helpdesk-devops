from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import UserRegister, UserLogin
from database import users_col
import bcrypt

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

    return {
        "username": db_user["username"],
        "user_type": db_user["user_type"],
        "role": db_user["role"],
        "department": db_user.get("department"),
        "employee_id": db_user.get("employee_id")
    }


@app.get("/health")
def health():
    return {"status": "ok"}