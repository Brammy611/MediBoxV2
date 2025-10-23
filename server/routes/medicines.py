from flask import Blueprint, request, jsonify
from services.medicine_service import MedicineService

medicines_bp = Blueprint('medicines', __name__)

# Alias supaya app.register_blueprint(medicines.bp) sukses
bp = medicines_bp

@medicines_bp.route('/api/medicines', methods=['POST'])
def add_medicine():
    data = request.get_json()
    try:
        medicine = MedicineService.add_medicine(data)
        return jsonify(medicine), 201
    except ValueError as exc:
        return jsonify({'message': str(exc)}), 400

@medicines_bp.route('/api/medicines/<medicine_id>', methods=['PUT'])
def update_medicine(medicine_id):
    data = request.get_json()
    try:
        medicine = MedicineService.update_medicine(medicine_id, data)
        return jsonify(medicine), 200
    except ValueError as exc:
        return jsonify({'message': str(exc)}), 400

@medicines_bp.route('/api/medicines/<medicine_id>', methods=['DELETE'])
def delete_medicine(medicine_id):
    try:
        deleted = MedicineService.delete_medicine(medicine_id)
        if not deleted:
            return jsonify({'message': 'Medicine not found'}), 404
        return jsonify({'message': 'Medicine deleted successfully'}), 200
    except ValueError as exc:
        return jsonify({'message': str(exc)}), 400

@medicines_bp.route('/api/medicines', methods=['GET'])
def get_medicines():
    medicines = MedicineService.get_all_medicines()
    return jsonify(medicines), 200