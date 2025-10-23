from datetime import datetime

import requests
from flask import Blueprint, current_app, jsonify, request

bp = Blueprint("health", __name__)


def _get_db():
    db = current_app.config.get("MONGO_DB")
    if db:
        return db

    uri = current_app.config.get("MONGO_URI") or current_app.config.get("MONGO")
    if not uri:
        return None

    from pymongo import MongoClient

    client = MongoClient(uri)
    return client.get_default_database()


def _prepare_result_payload(result: dict, timestamp: datetime) -> dict:
    recommendation = result.get("recommendation") or result.get("recommendations") or []
    if isinstance(recommendation, str):
        recommendation = [recommendation]

    payload = {
        "adherence_risk": result.get("adherence_risk") or result.get("risk"),
        "recommendation": recommendation,
        "captured_at": timestamp.isoformat(),
    }
    return payload


@bp.route("/api/health/check", methods=["POST"])
@bp.route("/api/health_check", methods=["POST"])
def health_check():
    """Process a health questionnaire and persist the summary."""
    data = request.get_json() or {}
    ai_url = current_app.config.get("AI_HUB_URL")

    try:
        if ai_url:
            response = requests.post(ai_url, json=data, timeout=10)
            response.raise_for_status()
            result = response.json()
        else:
            missed_rate = float(data.get("missed_rate", 0))
            if missed_rate >= 0.5:
                risk = "high"
            elif missed_rate >= 0.2:
                risk = "medium"
            else:
                risk = "low"

            result = {
                "adherence_risk": risk,
                "recommendation": [
                    "Increase water intake",
                    "Maintain consistent routine",
                    "Set earlier reminders",
                ],
            }
    except Exception as exc:  # pragma: no cover - network variability
        return jsonify({"error": "AI Hub request failed", "details": str(exc)}), 502

    timestamp = datetime.utcnow()
    payload = _prepare_result_payload(result, timestamp)

    db = _get_db()
    if db:
        try:
            db["health_reports"].insert_one(
                {
                    "box_id": data.get("box_id"),
                    "user_id": data.get("user_id"),
                    "input": data,
                    "result": result,
                    "adherence_risk": payload["adherence_risk"],
                    "recommendation": payload["recommendation"],
                    "captured_at": timestamp,
                    "created_at": timestamp,
                }
            )
        except Exception:  # pragma: no cover - best effort persistence
            pass

    return jsonify(payload), 200


@bp.route("/api/health/reports", methods=["GET"])
@bp.route("/api/get_health_report", methods=["GET"])
@bp.route("/api/get_health_report/<box_id>", methods=["GET"])
def get_health_report(box_id=None):
    """Return recent health reports with normalized fields."""
    db = _get_db()
    if not db:
        return jsonify({"error": "MongoDB not configured"}), 400

    requested_box_id = box_id or request.args.get("box_id")
    limit = request.args.get("limit", default=20, type=int)

    query = {}
    if requested_box_id:
        query["box_id"] = requested_box_id

    cursor = (
        db["health_reports"]
        .find(query)
        .sort("captured_at", -1)
        .limit(max(limit, 1))
    )

    results = []
    for doc in cursor:
        captured_at = doc.get("captured_at") or doc.get("created_at")
        if isinstance(captured_at, datetime):
            captured_iso = captured_at.isoformat()
        elif isinstance(captured_at, (int, float)):
            captured_iso = datetime.fromtimestamp(captured_at).isoformat()
        else:
            captured_iso = captured_at

        recommendation = doc.get("recommendation") or doc.get("result", {}).get("recommendation") or []
        if isinstance(recommendation, str):
            recommendation = [recommendation]

        results.append(
            {
                "id": str(doc.get("_id")),
                "box_id": doc.get("box_id"),
                "user_id": doc.get("user_id"),
                "adherence_risk": doc.get("adherence_risk")
                or doc.get("result", {}).get("adherence_risk"),
                "recommendation": recommendation,
                "captured_at": captured_iso,
                "raw": doc.get("result") or doc.get("input"),
            }
        )

    return jsonify(results), 200