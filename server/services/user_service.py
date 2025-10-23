from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo import MongoClient
from models.user import User

class UserService:
    def __init__(self, db_uri):
        self.client = MongoClient(db_uri)
        self.db = self.client['medibox']
        self.users_collection = self.db['users']

    def register_user(self, user_data):
        user = User(**user_data)
        self.users_collection.insert_one(user.to_dict())
        return jsonify({"message": "User registered successfully"}), 201

    def authenticate_user(self, username, password):
        user = self.users_collection.find_one({"username": username})
        if user and user['password'] == password:  # Replace with hashed password check
            return jsonify({"message": "Authentication successful"}), 200
        return jsonify({"message": "Invalid credentials"}), 401

    @jwt_required()
    def get_user_info(self):
        current_user = get_jwt_identity()
        user = self.users_collection.find_one({"username": current_user})
        if user:
            return jsonify(user), 200
        return jsonify({"message": "User not found"}), 404

    def update_user(self, username, update_data):
        result = self.users_collection.update_one({"username": username}, {"$set": update_data})
        if result.modified_count > 0:
            return jsonify({"message": "User updated successfully"}), 200
        return jsonify({"message": "No changes made"}), 400

    def delete_user(self, username):
        result = self.users_collection.delete_one({"username": username})
        if result.deleted_count > 0:
            return jsonify({"message": "User deleted successfully"}), 200
        return jsonify({"message": "User not found"}), 404