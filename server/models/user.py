from flask import jsonify
from flask_pymongo import PyMongo

mongo = PyMongo()

class User:
    def __init__(self, username, password, role):
        self.username = username
        self.password = password
        self.role = role

    def save_to_db(self):
        user_data = {
            "username": self.username,
            "password": self.password,
            "role": self.role
        }
        mongo.db.users.insert_one(user_data)

    @staticmethod
    def find_by_username(username):
        return mongo.db.users.find_one({"username": username})

    @staticmethod
    def get_all_users():
        return jsonify([user for user in mongo.db.users.find()])