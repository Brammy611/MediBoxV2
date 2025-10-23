"""Seed MongoDB with baseline data for MediBox development.

Run from the server directory after configuring your virtual environment:
    python -m scripts.seed_data
"""
from __future__ import annotations

import pathlib
import sys
from datetime import datetime, timedelta

from dotenv import load_dotenv
from pymongo import ASCENDING, MongoClient
from pymongo.errors import ConfigurationError, ServerSelectionTimeoutError
from werkzeug.security import generate_password_hash

# Ensure project modules are importable
ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from utils.config import Config  # noqa  # pylint: disable=wrong-import-position

COLLECTIONS = {
    "users": "Ensures baseline users (user/family/pharmacist).",
    "mediboxes": "Links box IDs to users and metadata.",
    "reminders": "Stores reminder schedules for each box/user.",
    "sensor_logs": "Historical readings from ESP32 sensors.",
    "intake_logs": "Tracks when medicine was taken or skipped.",
    "refill_requests": "Requests for medicine refills.",
    "medicines": "Pharmacist-managed medicine catalogue.",
    "health_reports": "AI-generated adherence insights.",
}

USERS = [
    {
        "username": "elderly_annie",
        "password": "password123",
        "role": "user",
        "full_name": "Annie Johnson",
    },
    {
        "username": "family_john",
        "password": "password123",
        "role": "family",
        "full_name": "John Johnson",
    },
    {
        "username": "pharma_lisa",
        "password": "password123",
        "role": "pharmacist",
        "full_name": "Lisa Smith",
    },
]

MEDIBOX_SAMPLE = {
    "box_id": "protobox-demo",
    "user_id": None,  # populated after inserting user
    "status": "active",
    "medicine_schedule": {
        "medicine_times": [
            {"time": "08:00", "message": "Minum Metformin setelah sarapan"},
            {"time": "20:00", "message": "Minum Metformin sebelum tidur"},
        ],
        "meal_times": [
            {"time": "07:30", "message": "Sarapan"},
            {"time": "19:00", "message": "Makan malam"},
        ],
    },
    "updated_at": datetime.utcnow(),
}

REMINDERS_SAMPLE = [
    {
        "box_id": "protobox-demo",
        "user_id": None,  # filled in later
        "message": "Minum Metformin",
        "name": "Metformin",
        "time": "08:00",
        "reminder_time": "08:00",
        "created_at": datetime.utcnow(),
    },
    {
        "box_id": "protobox-demo",
        "user_id": None,
        "message": "Minum Metformin",
        "name": "Metformin",
        "time": "20:00",
        "reminder_time": "20:00",
        "created_at": datetime.utcnow(),
    },
]

MEDICINE_CATALOG = [
    {
        "name": "Metformin",
        "dose": "500mg",
        "schedule": ["08:00", "20:00"],
        "notes": "Konsumsi setelah makan",
    },
    {
        "name": "Lisinopril",
        "dose": "10mg",
        "schedule": ["07:00"],
        "notes": "Pantau tekanan darah harian",
    },
]

SENSOR_LOG_SAMPLE = [
    {
        "box_id": "protobox-demo",
        "data": {
            "temperature": 27.5,
            "humidity": 68.0,
            "ldr_value": 1200,
            "medicine_taken": False,
        },
        "recorded_at": datetime.utcnow() - timedelta(minutes=15),
    },
    {
        "box_id": "protobox-demo",
        "data": {
            "temperature": 27.0,
            "humidity": 67.0,
            "ldr_value": 150,
            "medicine_taken": True,
        },
        "recorded_at": datetime.utcnow(),
    },
]

INTAKE_LOG_SAMPLE = [
    {
        "box_id": "protobox-demo",
        "medicine_id": "Metformin",
        "confirmed": True,
        "status": "taken",
        "taken_at": datetime.utcnow() - timedelta(hours=12),
    },
    {
        "box_id": "protobox-demo",
        "medicine_id": "Metformin",
        "confirmed": False,
        "status": "skipped",
        "taken_at": datetime.utcnow() - timedelta(hours=24),
    },
]

REFILL_REQUESTS_SAMPLE = [
    {
        "box_id": "protobox-demo",
        "medicine_name": "Metformin",
        "quantity": 30,
        "status": "pending",
        "requested_at": datetime.utcnow() - timedelta(days=1),
    }
]

HEALTH_REPORTS_SAMPLE = [
    {
        "box_id": "protobox-demo",
        "user_id": None,
        "input": {
            "avg_temp": 27.2,
            "avg_humidity": 68.5,
            "intake_pattern": 0.8,
            "missed_rate": 0.2,
            "sleep_quality": "average",
            "diet_score": 0.6,
        },
        "result": {
            "adherence_risk": "medium",
            "recommendation": [
                "Perbanyak minum air putih",
                "Jangan melewatkan sarapan",
                "Periksa pengingat pagi hari lebih awal",
            ],
        },
        "created_at": datetime.utcnow(),
    }
]


def get_database() -> tuple[MongoClient, str]:
    load_dotenv(ROOT / ".env")
    uri = Config.MONGO_URI
    db_name = Config.MONGO_DB

    def _try(uri_to_use: str, name: str | None):
        client = MongoClient(uri_to_use, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        db = client.get_database(name) if name else client.get_default_database()
        return client, db, uri_to_use

    try:
        client, db, active_uri = _try(uri, db_name)
    except (ServerSelectionTimeoutError, ConfigurationError, OSError) as exc:
        fallback = "mongodb://localhost:27017/medibox"
        print(f"Primary MongoDB unavailable ({exc}). Falling back to {fallback}.")
        client, db, active_uri = _try(fallback, None)

    return db, active_uri


def ensure_indexes(db):
    users = db["users"]
    users.create_index("username", unique=True)
    users.create_index("role")

    mediboxes = db["mediboxes"]
    mediboxes.create_index("box_id", unique=True)
    mediboxes.create_index("user_id")

    db["reminders"].create_index([("box_id", ASCENDING), ("reminder_time", ASCENDING)])
    db["sensor_logs"].create_index("box_id")
    db["sensor_logs"].create_index("recorded_at")
    db["intake_logs"].create_index("box_id")
    db["intake_logs"].create_index("taken_at")
    db["refill_requests"].create_index("box_id")
    db["medicines"].create_index("name", unique=True)
    db["health_reports"].create_index("box_id")


def seed_users(db):
    user_col = db["users"]
    inserted_ids = {}
    for user in USERS:
        hashed = generate_password_hash(user["password"])
        result = user_col.update_one(
            {"username": user["username"]},
            {"$setOnInsert": {
                "username": user["username"],
                "password_hash": hashed,
                "role": user["role"],
                "full_name": user.get("full_name"),
                "created_at": datetime.utcnow(),
            }},
            upsert=True,
        )
        doc = user_col.find_one({"username": user["username"]})
        inserted_ids[user["role"]] = doc["_id"]
    return inserted_ids


def seed_medibox(db, user_ids):
    collection = db["mediboxes"]
    payload = MEDIBOX_SAMPLE.copy()
    payload["user_id"] = user_ids.get("user")
    collection.update_one(
        {"box_id": payload["box_id"]},
        {"$set": payload, "$setOnInsert": {"created_at": datetime.utcnow()}},
        upsert=True,
    )


def seed_reminders(db, user_ids):
    collection = db["reminders"]
    for reminder in REMINDERS_SAMPLE:
        payload = reminder.copy()
        payload["user_id"] = user_ids.get("user")
        collection.update_one(
            {
                "box_id": payload["box_id"],
                "reminder_time": payload["reminder_time"],
            },
            {"$set": payload},
            upsert=True,
        )


def seed_medicines(db):
    collection = db["medicines"]
    for item in MEDICINE_CATALOG:
        collection.update_one(
            {"name": item["name"]},
            {"$set": {**item, "created_at": datetime.utcnow()}},
            upsert=True,
        )


def seed_sensor_logs(db):
    collection = db["sensor_logs"]
    for log in SENSOR_LOG_SAMPLE:
        collection.update_one(
            {"box_id": log["box_id"], "recorded_at": log["recorded_at"]},
            {"$set": log},
            upsert=True,
        )


def seed_intake_logs(db):
    collection = db["intake_logs"]
    for log in INTAKE_LOG_SAMPLE:
        collection.update_one(
            {"box_id": log["box_id"], "taken_at": log["taken_at"]},
            {"$set": log},
            upsert=True,
        )


def seed_refill_requests(db):
    collection = db["refill_requests"]
    for request in REFILL_REQUESTS_SAMPLE:
        collection.update_one(
            {"box_id": request["box_id"], "medicine_name": request["medicine_name"]},
            {"$set": request},
            upsert=True,
        )


def seed_health_reports(db, user_ids):
    collection = db["health_reports"]
    for report in HEALTH_REPORTS_SAMPLE:
        payload = report.copy()
        payload["user_id"] = user_ids.get("user")
        collection.update_one(
            {"box_id": payload["box_id"], "created_at": payload["created_at"]},
            {"$set": payload},
            upsert=True,
        )


def main():
    db, uri = get_database()
    print(f"Connected to MongoDB: {uri}")
    print("Ensuring collections and indexes...")
    ensure_indexes(db)
    user_ids = seed_users(db)
    seed_medibox(db, user_ids)
    seed_reminders(db, user_ids)
    seed_medicines(db)
    seed_sensor_logs(db)
    seed_intake_logs(db)
    seed_refill_requests(db)
    seed_health_reports(db, user_ids)
    print("Seeding completed successfully.")


if __name__ == "__main__":
    main()
