from flask_mqtt import Mqtt
from flask import current_app
import json

class MqttService:
    def __init__(self, app=None):
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        self.mqtt = Mqtt(app)

        @self.mqtt.on_connect()
        def handle_connect(client, userdata, flags, rc):
            current_app.logger.info("Connected to MQTT Broker")
            self.mqtt.subscribe("medibox/data/#")
            self.mqtt.subscribe("medibox/reminder/#")

        @self.mqtt.on_message()
        def handle_message(client, userdata, message):
            topic = message.topic
            payload = json.loads(message.payload.decode())
            current_app.logger.info(f"Received message on {topic}: {payload}")
            # Handle incoming messages based on the topic
            if topic.startswith("medibox/data/"):
                self.handle_sensor_data(payload)
            elif topic.startswith("medibox/reminder/"):
                self.handle_reminder_message(payload)

    def handle_sensor_data(self, data):
        # Process sensor data
        current_app.logger.info(f"Processing sensor data: {data}")

    def handle_reminder_message(self, data):
        # Process reminder messages
        current_app.logger.info(f"Processing reminder message: {data}")

    def publish_reminder(self, box_id, message):
        topic = f"medibox/reminder/{box_id}"
        self.mqtt.publish(topic, json.dumps(message))
        current_app.logger.info(f"Published reminder to {topic}: {message}")