from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from services.reminder_service import ReminderService


def create_reminder_blueprint(db):
    reminder_bp = Blueprint('reminder', __name__)
    reminder_service = ReminderService(db)

    def _get_optional_identity():
        try:
            verify_jwt_in_request(optional=True)
            return get_jwt_identity()
        except Exception:
            return None

    @reminder_bp.route('/api/reminders', methods=['GET'])
    @reminder_bp.route('/api/get_reminders', methods=['GET'])
    def list_reminders():
        scope = request.args.get('scope')
        user_id = request.args.get('user_id')
        box_id = request.args.get('box_id')

        if not user_id and scope in {'active', 'household', 'user'}:
            user_id = _get_optional_identity()

        limit = request.args.get('limit', default=100, type=int)

        reminders = reminder_service.list_reminders(
            user_id=user_id,
            box_id=box_id,
            scope=scope,
            limit=limit,
        )
        return jsonify(reminders), 200

    @reminder_bp.route('/api/reminders', methods=['POST'])
    def create_reminder():
        payload = request.get_json() or {}
        user_id = payload.get('user_id') or _get_optional_identity()
        reminder = reminder_service.create_reminder(user_id, payload)
        return jsonify(reminder), 201

    @reminder_bp.route('/api/reminders/<reminder_id>', methods=['DELETE'])
    def delete_reminder(reminder_id):
        user_id = request.args.get('user_id') or _get_optional_identity()
        deleted = reminder_service.delete_reminder(reminder_id, user_id=user_id)
        if not deleted:
            return jsonify({'message': 'Reminder not found'}), 404
        return jsonify({'message': 'Reminder deleted'}), 200

    return reminder_bp
