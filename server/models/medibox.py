from flask import current_app
from flask_pymongo import PyMongo

mongo = PyMongo()

class MediBox:
    def __init__(self, box_id, user_id, medicine_schedule, last_intake_time):
        self.box_id = box_id
        self.user_id = user_id
        self.medicine_schedule = medicine_schedule
        self.last_intake_time = last_intake_time

    def save(self):
        mongo.db.mediboxes.insert_one(self.to_dict())

    def to_dict(self):
        return {
            "box_id": self.box_id,
            "user_id": self.user_id,
            "medicine_schedule": self.medicine_schedule,
            "last_intake_time": self.last_intake_time
        }

    @staticmethod
    def get_by_id(box_id):
        return mongo.db.mediboxes.find_one({"box_id": box_id})

    @staticmethod
    def update(box_id, updates):
        mongo.db.mediboxes.update_one({"box_id": box_id}, {"$set": updates})