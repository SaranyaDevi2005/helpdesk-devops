from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from models import Ticket, TicketUpdate
from database import tickets_col, users_col
from bson import ObjectId
from email_utils import send_email

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

# ── TICKETS ───────────────────────────────────────

@app.post("/tickets")
def create_ticket(ticket: Ticket, background_tasks: BackgroundTasks, user=Depends(get_current_user)):
    print("🔥 Creating ticket for:", ticket.created_by)

    result = tickets_col.insert_one(ticket.dict())

    user_db = users_col.find_one({"username": ticket.created_by})

    if user_db and "email" in user_db:
        background_tasks.add_task(
            send_email,
            user_db["email"],
            "🎫 Ticket Created",
            f"""
            Hello {user_db['username']},

            Your ticket "{ticket.title}" has been successfully created.

            We will update you soon.

            - HelpDesk Team
            """
        )

    return {"id": str(result.inserted_id), "message": "Ticket created"}


@app.get("/tickets")
def get_tickets(user=Depends(get_current_user)):
    tickets = []

    if user["user_type"] == "admin":
        query = {}
    else:
        query = {"created_by": user["username"]}

    for t in tickets_col.find(query):
        t["_id"] = str(t["_id"])
        tickets.append(t)

    return tickets


@app.get("/tickets/{username}")
def get_user_tickets(username: str, user=Depends(get_current_user)):

    # ✅ SECURITY CHECK
    if user["username"] != username and user["user_type"] != "admin":
        raise HTTPException(403, "Not allowed")

    tickets = []
    for t in tickets_col.find({"created_by": username}):
        t["_id"] = str(t["_id"])
        tickets.append(t)
    return tickets


@app.put("/tickets/{ticket_id}")
def update_ticket(ticket_id: str, update: TicketUpdate, background_tasks: BackgroundTasks, user=Depends(get_current_user)):

    print("🔥 Update request:", update.dict())

    ticket = tickets_col.find_one({"_id": ObjectId(ticket_id)})

    if not ticket:
        raise HTTPException(404, "Ticket not found")

    old_status = ticket.get("status")

    tickets_col.update_one(
        {"_id": ObjectId(ticket_id)},
        {"$set": update.dict(exclude_none=True)}
    )

    new_status = update.status if update.status else old_status

    user_db = users_col.find_one({"username": ticket["created_by"]})

    print("👤 User found:", user_db)

    if user_db and "email" in user_db and update.status:

        print("📨 Triggering email...")

        background_tasks.add_task(
            send_email,
            user_db["email"],
            "🔄 Ticket Status Updated",
            f"""
Hello {user_db['username']},

Your ticket "{ticket['title']}" has been updated.

Old Status: {old_status}
New Status: {new_status}

- HelpDesk Team
"""
        )

    return {"message": "Ticket updated"}


@app.delete("/tickets/{ticket_id}")
def delete_ticket(ticket_id: str, user=Depends(get_current_user)):

    # ✅ ADMIN ONLY DELETE
    if user["user_type"] != "admin":
        raise HTTPException(403, "Admin only")

    tickets_col.delete_one({"_id": ObjectId(ticket_id)})
    return {"message": "Ticket deleted"}


# ── STATS ─────────────────────────────────────────

@app.get("/stats")
def get_stats(user=Depends(get_current_user)):

    # ✅ ADMIN ONLY STATS
    if user["user_type"] != "admin":
        raise HTTPException(403, "Admin only")

    total = tickets_col.count_documents({})
    open_ = tickets_col.count_documents({"status": "Open"})
    in_progress = tickets_col.count_documents({"status": "In Progress"})
    resolved = tickets_col.count_documents({"status": "Resolved"})
    high_priority = tickets_col.count_documents({"priority": "High"})

    return {
        "total": total,
        "open": open_,
        "in_progress": in_progress,
        "resolved": resolved,
        "high_priority": high_priority
    }


@app.get("/health")
def health():
    return {"status": "ok"}