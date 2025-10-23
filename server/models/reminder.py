from mongoengine import Document, StringField, DateTimeField, BooleanField, ListField, ReferenceField
from datetime import datetime

class Reminder(Document):
    user_id = StringField(required=True)
    medicine_id = StringField(required=True)
    reminder_time = DateTimeField(required=True)
    is_taken = BooleanField(default=False)
    notes = ListField(StringField())
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'reminders'
    }