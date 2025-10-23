from datetime import datetime

from flask import Blueprint, current_app, g, jsonify, request
from bson import ObjectId
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError, OperationFailure
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
)

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _get_db():
    """Resolve and cache a Mongo database handle for the current request."""
    if hasattr(g, "mongo_db"):
        return g.mongo_db

    preconfigured = current_app.config.get("MONGO_DB")
    if preconfigured is not None:
        g.mongo_db = preconfigured
        return preconfigured

    uri = current_app.config.get("MONGO_URI") or current_app.config.get("MONGO")
    if not uri:
        raise RuntimeError("MONGO_URI not configured in app.config")

    client = MongoClient(uri)
    db = client.get_default_database()
    g.mongo_client = client
    g.mongo_db = db
    return db


def _sanitize_user(document: dict | None) -> dict | None:
    if not document:
        return None

    sanitized = {
        "id": str(document.get("_id")) if document.get("_id") is not None else None,
        "username": document.get("username"),
        "email": document.get("email") or document.get("username"),
        "role": document.get("role", "user"),
        "created_at": document.get("created_at"),
    }
    return sanitized


def _ensure_user_indexes(db):
    users = db["users"]
    try:
        users.create_index("username", unique=True, background=True)
        users.create_index("email", unique=True, sparse=True, background=True)
    except OperationFailure as exc:
        current_app.logger.warning("Skipping user index enforcement: %s", exc)


def _find_user_by_identifier(users, identifier: str | None):
    if not identifier:
        return None
    user = users.find_one({"username": identifier})
    if user:
        return user
    return users.find_one({"email": identifier})


@bp.route("/register", methods=["POST"])
def register():
    print("🔵 /api/auth/register endpoint called!")  # ✅ Debug log
    print(f"🔵 Request method: {request.method}")
    print(f"🔵 Request content-type: {request.content_type}")
    payload = request.get_json() or {}
    print(f"🔵 Payload received: {payload}")
    username = payload.get("username") or payload.get("email")
    password = payload.get("password")
    role = payload.get("role", "user")

    if not username or not password:
        return jsonify({"message": "username/email and password required"}), 400

    db = _get_db()
    _ensure_user_indexes(db)
    users = db["users"]

    if _find_user_by_identifier(users, username):
        return jsonify({"message": "username or email already registered"}), 409

    now = datetime.utcnow()
    record = {
        "username": username,
        "email": payload.get("email"),
        "password_hash": generate_password_hash(password),
        "role": role,
        "created_at": now.isoformat(),
    }

    try:
        result = users.insert_one(record)
    except DuplicateKeyError:
        return jsonify({"message": "username or email already registered"}), 409

    record["_id"] = result.inserted_id

    sanitized = _sanitize_user(record)
    return jsonify({"message": "user created", "user": sanitized}), 201


@bp.route("/login", methods=["POST"])
def login():
    payload = request.get_json() or {}
    identifier = payload.get("username") or payload.get("email")
    password = payload.get("password")

    if not identifier or not password:
        return jsonify({"message": "username/email and password required"}), 400

    db = _get_db()
    users = db["users"]
    user = _find_user_by_identifier(users, identifier)

    if not user or not check_password_hash(user.get("password_hash", ""), password):
        return jsonify({"message": "invalid credentials"}), 401

    identity = str(user["_id"])
    access_token = create_access_token(
        identity=identity,
        additional_claims={"role": user.get("role", "user")},
    )

    sanitized = _sanitize_user(user)
    return jsonify({"access_token": access_token, "user": sanitized, "role": sanitized["role"]}), 200


@bp.route("/me", methods=["GET"])
@bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    uid = get_jwt_identity()
    if not uid:
        return jsonify({"message": "user not found"}), 404

    db = _get_db()
    user = db["users"].find_one({"_id": ObjectId(uid)})

    if not user:
        return jsonify({"message": "user not found"}), 404

    sanitized = _sanitize_user(user)
    return jsonify({"user": sanitized, "role": sanitized["role"]}), 200