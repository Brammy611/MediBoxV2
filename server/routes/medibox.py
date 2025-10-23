from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from services.medibox_service import MediBoxService


def create_medibox_blueprint(db):
    medibox_bp = Blueprint('medibox', __name__)
    medibox_service = MediBoxService(db)

    def _optional_identity():
        try:
            verify_jwt_in_request(optional=True)
            return get_jwt_identity()
        except Exception:
            return None

    @medibox_bp.route('/api/mediboxes/register', methods=['POST'])
    @medibox_bp.route('/api/register_box', methods=['POST'])
    def register_box():
        payload = request.get_json() or {}
        try:
            result = medibox_service.register_box(
                box_id=payload.get('box_id'),
                user_id=payload.get('user_id') or _optional_identity(),
                metadata={k: v for k, v in payload.items() if k not in {'box_id', 'user_id', 'box_secret'}},
                box_secret=payload.get('box_secret') or payload.get('box_token'),
            )
            return jsonify(result), 201
        except ValueError as exc:
            return jsonify({'message': str(exc)}), 400

    @medibox_bp.route('/api/mediboxes/auth', methods=['POST'])
    def authenticate_medibox():
        payload = request.get_json() or {}
        box_id = payload.get('box_id')
        token = payload.get('token') or payload.get('box_secret') or payload.get('box_token')

        record = medibox_service.authenticate_device(box_id, token)
        if not record:
            return jsonify({'message': 'Invalid device credentials'}), 401

        return jsonify(record), 200

    @medibox_bp.route('/api/mediboxes/<box_id>/medicine', methods=['PUT'])
    @medibox_bp.route('/api/update_medicine', methods=['PUT'])
    def update_medicine(box_id=None):
        payload = request.get_json() or {}
        try:
            result = medibox_service.update_medicine(
                box_id=box_id or payload.get('box_id'),
                medicine_data=payload.get('medicine_data') or {},
            )
            return jsonify(result), 200
        except ValueError as exc:
            return jsonify({'message': str(exc)}), 400

    @medibox_bp.route('/api/mediboxes/<box_id>/sensor', methods=['POST'])
    @medibox_bp.route('/api/send_data', methods=['POST'])
    def send_data(box_id=None):
        payload = request.get_json() or {}
        try:
            record = medibox_service.record_sensor_data(
                box_id=box_id or payload.get('box_id'),
                sensor_data=payload.get('sensor_data') or payload,
            )
            return jsonify(record), 201
        except ValueError as exc:
            return jsonify({'message': str(exc)}), 400

    @medibox_bp.route('/api/intake/logs', methods=['POST'])
    @medibox_bp.route('/api/log_intake', methods=['POST'])
    def log_intake():
        payload = request.get_json() or {}
        user_id = payload.get('user_id') or _optional_identity()
        entry = medibox_service.log_intake(
            medicine_id=payload.get('medicineId') or payload.get('medicine_id'),
            confirmed=payload.get('confirmed', True),
            user_id=user_id,
            box_id=payload.get('box_id'),
        )
        return jsonify(entry), 201

    @medibox_bp.route('/api/adherence/logs', methods=['GET'])
    @medibox_bp.route('/api/get_adherence_logs', methods=['GET'])
    def get_adherence_logs():
        user_id = request.args.get('user_id') or _optional_identity()
        box_id = request.args.get('box_id')
        limit = request.args.get('limit', default=50, type=int)

        logs = medibox_service.list_adherence_logs(
            user_id=user_id,
            box_id=box_id,
            limit=limit,
        )
        return jsonify(logs), 200

    @medibox_bp.route('/api/refill/requests', methods=['GET'])
    @medibox_bp.route('/api/get_refill_requests', methods=['GET'])
    @medibox_bp.route('/api/refill_requests', methods=['GET'])
    def get_refill_requests():
        scope = request.args.get('scope')
        status = request.args.get('status')
        user_id = request.args.get('user_id') or _optional_identity()
        box_id = request.args.get('box_id')
        limit = request.args.get('limit', default=100, type=int)

        requests_data = medibox_service.list_refill_requests(
            box_id=box_id,
            user_id=user_id,
            scope=scope,
            status=status,
            limit=limit,
        )
        return jsonify(requests_data), 200

    @medibox_bp.route('/api/refill/requests', methods=['POST'])
    @medibox_bp.route('/api/refill_requests', methods=['POST'])
    def create_refill_request():
        payload = request.get_json() or {}
        user_id = payload.get('user_id') or _optional_identity()
        payload['user_id'] = user_id
        try:
            entry = medibox_service.create_refill_request(payload)
            return jsonify(entry), 201
        except ValueError as exc:
            return jsonify({'message': str(exc)}), 400

    @medibox_bp.route('/api/refill/requests/<request_id>/<action>', methods=['POST'])
    def update_refill_request(request_id, action):
        action = action.lower()
        if action not in {'approve', 'reject', 'fulfill'}:
            return jsonify({'message': 'Unsupported action'}), 400

        payload = request.get_json() or {}
        actor_id = _optional_identity()
        if not actor_id and payload.get('actor_id'):
            actor_id = payload['actor_id']

        notes = payload.get('notes')
        status_map = {
            'approve': 'approved',
            'reject': 'denied',
            'fulfill': 'fulfilled',
        }

        updated = medibox_service.update_refill_request_status(
            request_id=request_id,
            status=status_map[action],
            actor_id=actor_id,
            notes=notes,
        )

        if not updated:
            return jsonify({'message': 'Refill request not found'}), 404

        return jsonify(updated), 200

    return medibox_bp
