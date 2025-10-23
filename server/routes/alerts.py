from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

alerts_bp = Blueprint('alerts', __name__, url_prefix='/api')

@alerts_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    alerts = [
        {"id": 1, "message": "Take medicine A"},
        {"id": 2, "message": "Take medicine B"}
    ]
    return jsonify(alerts)
