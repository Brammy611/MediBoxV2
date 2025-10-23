from mongoengine import Document, StringField, FloatField, DateTimeField, ListField, ReferenceField
from datetime import datetime

class Sensor(Document):
    user_id = StringField(required=True)
    box_id = StringField(required=True)
    light_level = FloatField(required=True)
    temperature = FloatField(required=True)
    humidity = FloatField(required=True)
    timestamp = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'sensors'
    }