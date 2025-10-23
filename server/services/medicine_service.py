from flask import current_app
from pymongo import MongoClient
from bson.objectid import ObjectId
import time

def _get_db():
    """
    Resolve a PyMongo database object from common app configurations.
    Expects one of:
      - Flask-PyMongo registered in current_app.extensions['pymongo'] (client key)
      - current_app.mongo (Flask-PyMongo instance)
      - current_app.config['MONGO_URI'] (creates a temporary client)
      - current_app.config['MONGO_DB'] (already a DB object)
    """
    # 1) Flask-PyMongo in extensions
    ext = getattr(current_app, "extensions", None)
    if ext and "pymongo" in ext:
        client = ext["pymongo"].get("client")
        if client:
            return client.get_default_database()

    # 2) current_app.mongo (common pattern)
    mongo_attr = getattr(current_app, "mongo", None)
    if mongo_attr:
        try:
            return mongo_attr.db
        except Exception:
            pass

    # 3) Direct DB object in config
    db_obj = current_app.config.get("MONGO_DB")
    if db_obj:
        return db_obj

    # 4) MONGO_URI fallback
    uri = current_app.config.get("MONGO_URI") or current_app.config.get("MONGO")
    if uri and isinstance(uri, str):
        client = MongoClient(uri)
        return client.get_default_database()

    raise RuntimeError("MongoDB client not configured in Flask app")

def _collection():
    return _get_db()["medicines"]

def _serialize(doc):
    if not doc:
        return None
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc

class MedicineService:
    @staticmethod
    def add_medicine(data: dict) -> dict:
        """
        Insert a new medicine document.
        Expected data keys: name (str), dose (str), schedule (list of times or dicts), optional notes
        """
        if not isinstance(data, dict):
            raise ValueError("Invalid data")
        name = data.get("name")
        if not name:
            raise ValueError("Medicine 'name' is required")
        doc = {
            "name": name,
            "dose": data.get("dose", ""),
            "schedule": data.get("schedule", []),
            "notes": data.get("notes", ""),
            "created_at": int(time.time())
        }
        coll = _collection()
        res = coll.insert_one(doc)
        doc["_id"] = res.inserted_id
        return _serialize(doc)

    @staticmethod
    def update_medicine(medicine_id: str, data: dict) -> dict:
        """
        Update medicine by id. Returns the updated document.
        """
        if not medicine_id:
            raise ValueError("medicine_id required")
        try:
            oid = ObjectId(medicine_id)
        except Exception:
            raise ValueError("Invalid medicine_id")
        update_fields = {}
        for k in ("name", "dose", "schedule", "notes"):
            if k in data:
                update_fields[k] = data[k]
        if not update_fields:
            raise ValueError("No updatable fields provided")
        coll = _collection()
        coll.update_one({"_id": oid}, {"$set": update_fields})
        doc = coll.find_one({"_id": oid})
        return _serialize(doc)

    @staticmethod
    def delete_medicine(medicine_id: str) -> bool:
        """
        Delete medicine by id. Returns True if deleted.
        """
        if not medicine_id:
            raise ValueError("medicine_id required")
        try:
            oid = ObjectId(medicine_id)
        except Exception:
            raise ValueError("Invalid medicine_id")
        coll = _collection()
        res = coll.delete_one({"_id": oid})
        return res.deleted_count == 1

    @staticmethod
    def get_all_medicines() -> list:
        """
        Return all medicines as a list of serialized dicts.
        """
        coll = _collection()
        docs = coll.find().sort("created_at", -1)
        return [_serialize(d) for d in docs]
