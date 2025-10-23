from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from pymongo import ReturnDocument
from werkzeug.security import check_password_hash, generate_password_hash


class MediBoxService:
    def __init__(self, db):
        self.db = db
        self.mediboxes = db["mediboxes"]
        self.sensor_logs = db["sensor_logs"]
        self.intake_logs = db["intake_logs"]
        self.refill_requests = db["refill_requests"]

    @staticmethod
    def _serialize(doc: dict) -> dict:
        data = dict(doc)
        if "_id" in data:
            data["id"] = str(data.pop("_id"))
        data.pop("box_secret_hash", None)
        data.pop("box_secret", None)

        for key, value in list(data.items()):
            if isinstance(value, datetime):
                data[key] = value.isoformat()
            elif key.endswith("_id") and isinstance(value, ObjectId):
                data[key] = str(value)
        return data

    def register_box(self, box_id: str, user_id: str, metadata: Optional[dict] = None, box_secret: Optional[str] = None) -> dict:
        if not box_id or not user_id:
            raise ValueError("box_id and user_id are required")

        payload = {
            "owner_user_id": user_id,
            "box_id": box_id,
            "status": "active",
            "updated_at": datetime.utcnow(),
        }
        if metadata:
            payload.update(metadata)

        if box_secret:
            payload["box_secret_hash"] = generate_password_hash(box_secret)

        self.mediboxes.update_one(
            {"box_id": box_id},
            {"$set": payload, "$setOnInsert": {"created_at": datetime.utcnow()}},
            upsert=True,
        )

        record = self.mediboxes.find_one({"box_id": box_id})
        return self._serialize(record)

    def update_medicine(self, box_id: str, medicine_data: dict) -> dict:
        if not box_id:
            raise ValueError("box_id is required")

        update_payload = {
            "medicine_schedule": medicine_data,
            "updated_at": datetime.utcnow(),
        }
        self.mediboxes.update_one({"box_id": box_id}, {"$set": update_payload}, upsert=True)
        record = self.mediboxes.find_one({"box_id": box_id})
        return self._serialize(record)

    def record_sensor_data(self, box_id: str, sensor_data: dict) -> dict:
        if not box_id:
            raise ValueError("box_id is required")
        payload = {
            "box_id": box_id,
            "data": sensor_data,
            "recorded_at": datetime.utcnow(),
        }
        result = self.sensor_logs.insert_one(payload)
        payload["_id"] = result.inserted_id
        self.mediboxes.update_one(
            {"box_id": box_id},
            {"$set": {"last_sensor_at": datetime.utcnow()}}
        )
        return self._serialize(payload)

    def log_intake(
        self,
        medicine_id: Optional[str],
        confirmed: bool,
        user_id: Optional[str] = None,
        box_id: Optional[str] = None,
    ) -> dict:
        entry = {
            "medicine_id": medicine_id,
            "user_id": user_id,
            "box_id": box_id,
            "confirmed": bool(confirmed),
            "taken_at": datetime.utcnow(),
            "status": "taken" if confirmed else "skipped",
        }
        result = self.intake_logs.insert_one(entry)
        entry["_id"] = result.inserted_id
        if box_id:
            self.mediboxes.update_one(
                {"box_id": box_id},
                {"$set": {"last_intake_at": datetime.utcnow()}}
            )
        return self._serialize(entry)

    def list_adherence_logs(
        self,
        box_id: Optional[str] = None,
        user_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[dict]:
        query = {}
        if box_id:
            query["box_id"] = box_id
        if user_id:
            query["user_id"] = user_id

        docs = (
            self.intake_logs
            .find(query)
            .sort("taken_at", -1)
            .limit(max(limit, 1))
        )
        output = []
        for doc in docs:
            serialized = self._serialize(doc)
            taken_at = doc.get("taken_at")
            if isinstance(taken_at, datetime):
                serialized["date"] = taken_at.isoformat()
            serialized.setdefault("medicine", doc.get("medicine_id"))
            serialized.setdefault("status", doc.get("status", "taken"))
            output.append(serialized)
        return output

    def list_refill_requests(
        self,
        box_id: Optional[str] = None,
        user_id: Optional[str] = None,
        scope: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ) -> List[dict]:
        query = {}
        if box_id:
            query["box_id"] = box_id
        if user_id and scope in {"household", "user", "active"}:
            query["user_id"] = user_id
        if status:
            query["status"] = status
        if scope == "managed":
            query.setdefault("status", {"$ne": "archived"})

        docs = (
            self.refill_requests
            .find(query)
            .sort("requested_at", -1)
            .limit(max(limit, 1))
        )
        output = []
        for doc in docs:
            serialized = self._serialize(doc)
            serialized.setdefault("medicineName", doc.get("medicine_name"))
            serialized.setdefault("status", doc.get("status", "pending"))
            serialized.setdefault("quantity", doc.get("quantity"))
            output.append(serialized)
        return output

    def create_refill_request(self, payload: dict) -> dict:
        if not payload.get("medicineName") and not payload.get("medicine_name"):
            raise ValueError("medicine name is required")
        entry = {
            "medicine_name": payload.get("medicineName") or payload.get("medicine_name"),
            "quantity": payload.get("quantity"),
            "status": payload.get("status", "pending"),
            "requested_at": datetime.utcnow(),
            "box_id": payload.get("box_id"),
            "user_id": payload.get("user_id"),
            "notes": payload.get("notes"),
        }
        result = self.refill_requests.insert_one(entry)
        entry["_id"] = result.inserted_id
        return self._serialize(entry)

    def update_refill_request_status(
        self,
        request_id: str,
        status: str,
        actor_id: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Optional[dict]:
        if not request_id:
            raise ValueError("request_id is required")

        try:
            object_id = ObjectId(request_id)
        except Exception as exc:  # pragma: no cover - value error path
            raise ValueError("Invalid refill request id") from exc

        update_payload = {
            "status": status,
            "updated_at": datetime.utcnow(),
        }
        if actor_id:
            update_payload["handled_by"] = actor_id
            update_payload["handled_at"] = datetime.utcnow()
        if notes:
            update_payload["notes"] = notes

        result = self.refill_requests.find_one_and_update(
            {"_id": object_id},
            {"$set": update_payload},
            return_document=ReturnDocument.AFTER,
        )

        if not result:
            return None

        return self._serialize(result)

    def get_box(self, box_id: str) -> Optional[dict]:
        if not box_id:
            return None
        doc = self.mediboxes.find_one({"box_id": box_id})
        if not doc:
            return None
        return self._serialize(doc)

    def authenticate_device(self, box_id: str, provided_token: Optional[str]) -> Optional[dict]:
        if not box_id or not provided_token:
            return None

        record = self.mediboxes.find_one({"box_id": box_id})
        if not record:
            return None

        stored_hash = record.get("box_secret_hash")
        if stored_hash and check_password_hash(stored_hash, provided_token):
            self.mediboxes.update_one(
                {"box_id": box_id},
                {"$set": {"last_seen_at": datetime.utcnow()}}
            )
            return self._serialize(record)

        legacy_secret = record.get("box_secret") or record.get("box_token")
        if legacy_secret and legacy_secret == provided_token:
            self.mediboxes.update_one(
                {"box_id": box_id},
                {"$set": {
                    "last_seen_at": datetime.utcnow(),
                    "box_secret_hash": generate_password_hash(legacy_secret),
                    "box_secret": None,
                }}
            )
            refreshed = self.mediboxes.find_one({"box_id": box_id})
            return self._serialize(refreshed)

        return None