from flask import current_app
import requests

class AIService:
    def __init__(self):
        self.ai_hub_url = current_app.config['AI_HUB_URL']

    def analyze_health(self, user_data):
        response = requests.post(self.ai_hub_url, json=user_data)
        if response.status_code == 200:
            return response.json()
        else:
            return None

    def get_recommendations(self, user_id, avg_temp, avg_humidity, intake_pattern, missed_rate, sleep_quality, diet_score):
        user_data = {
            "user_id": user_id,
            "avg_temp": avg_temp,
            "avg_humidity": avg_humidity,
            "intake_pattern": intake_pattern,
            "missed_rate": missed_rate,
            "sleep_quality": sleep_quality,
            "diet_score": diet_score
        }
        return self.analyze_health(user_data)