from mongoengine import Document, StringField, FloatField, DateTimeField, ListField, ReferenceField
from datetime import datetime

class HealthReport(Document):
    user_id = StringField(required=True)
    report_date = DateTimeField(default=datetime.utcnow)
    avg_temp = FloatField(required=True)
    avg_humidity = FloatField(required=True)
    intake_pattern = FloatField(required=True)
    missed_rate = FloatField(required=True)
    sleep_quality = StringField(required=True)
    diet_score = FloatField(required=True)
    adherence_risk = StringField()
    recommendations = ListField(StringField())

    meta = {
        'collection': 'health_reports'
    }