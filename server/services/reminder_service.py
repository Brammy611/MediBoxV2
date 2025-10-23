from datetime import datetime
from typing import List, Optional

from bson import ObjectId


class ReminderService:
    def __init__(self, db):
        self._collection = db["reminders"]

    @staticmethod
    def _serialize(doc: dict) -> dict:
        data = dict(doc)
        data["id"] = str(data.pop("_id"))

        reminder_time = data.get("reminder_time")
        if isinstance(reminder_time, datetime):
            data["time"] = reminder_time.isoformat()
        elif reminder_time:
            data["time"] = reminder_time

        if "medicine_name" in data and not data.get("name"):
            data["name"] = data["medicine_name"]

        if not data.get("message") and data.get("name"):
            data["message"] = data["name"]
        if not data.get("name") and data.get("message"):
            data["name"] = data["message"]

        if data.get("time") and "reminder_time" not in data:
            data["reminder_time"] = data["time"]

        return data

    def list_reminders(
        self,
        user_id: Optional[str] = None,
        box_id: Optional[str] = None,
        scope: Optional[str] = None,
        limit: int = 100,
    ) -> List[dict]:
        query = {}
        if user_id:
            query["user_id"] = user_id
        if box_id:
            query["box_id"] = box_id
        if scope == "managed":
            query.setdefault("status", {"$ne": "archived"})

        docs = (
            self._collection
            .find(query)
            .sort("reminder_time", 1)
            .limit(max(limit, 1))
        )
        return [self._serialize(doc) for doc in docs]

    def create_reminder(self, user_id: Optional[str], payload: dict) -> dict:
        now = datetime.utcnow()
        reminder_time = payload.get("time") or payload.get("reminder_time")
        doc = {
            "user_id": user_id,
            "box_id": payload.get("box_id"),
            "medicine_name": payload.get("medicineName") or payload.get("name"),
            "message": payload.get("message"),
            "reminder_time": reminder_time,
            "notes": payload.get("notes"),
            "created_at": now,
            "updated_at": now,
        }
        result = self._collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._serialize(doc)

    def delete_reminder(self, reminder_id: str, user_id: Optional[str] = None) -> bool:
        try:
            query = {"_id": ObjectId(reminder_id)}
        except Exception as exc:
            raise ValueError("Invalid reminder id") from exc

        if user_id:
            query["user_id"] = user_id

        result = self._collection.delete_one(query)
        return result.deleted_count == 1