from mongoengine import Document, StringField, IntField, ListField, DateTimeField

class Medicine(Document):
    name = StringField(required=True)
    dosage = StringField(required=True)
    frequency = IntField(required=True)  # Number of times per day
    start_date = DateTimeField(required=True)
    end_date = DateTimeField(required=True)
    instructions = StringField()
    side_effects = ListField(StringField())
    user_id = StringField(required=True)  # Reference to the user this medicine belongs to

    meta = {
        'collection': 'medicines'
    }