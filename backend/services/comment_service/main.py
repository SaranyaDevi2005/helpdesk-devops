from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import Comment
from database import comments_col
from datetime import datetime

# ✅ JWT IMPORTS
from jose import jwt, JWTError
from dotenv import load_dotenv
import os
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

security = HTTPBearer()

# ── JWT VERIFY ──────────────────────────
def verify_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(401, "Invalid token")

    return payload


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── COMMENTS ──────────────────────────────────────

@app.post("/tickets/{ticket_id}/comments")
def add_comment(ticket_id: str, comment: Comment, user=Depends(get_current_user)):
    data = comment.dict()
    data["created_at"] = datetime.utcnow().isoformat()
    comments_col.insert_one(data)
    return {"message": "Comment added"}


@app.get("/tickets/{ticket_id}/comments")
def get_comments(ticket_id: str, user=Depends(get_current_user)):
    result = []
    for c in comments_col.find({"ticket_id": ticket_id}):
        c["_id"] = str(c["_id"])
        result.append(c)
    return result


@app.get("/health")
def health():
    return {"status": "ok"}