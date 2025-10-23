from sklearn.ensemble import RandomForestClassifier
import numpy as np
import json
import requests

class HealthAdherenceModel:
    def __init__(self):
        self.model = RandomForestClassifier()
        self.trained = False

    def train(self, X, y):
        self.model.fit(X, y)
        self.trained = True

    def predict(self, input_data):
        if not self.trained:
            raise Exception("Model is not trained yet.")
        input_array = np.array([[input_data['avg_temp'], input_data['avg_humidity'], 
                                  input_data['intake_pattern'], input_data['missed_rate'], 
                                  input_data['diet_score']]])
        prediction = self.model.predict(input_array)
        return prediction[0]

    def generate_recommendations(self, adherence_risk):
        recommendations = {
            "low": ["Maintain your current routine.", "Keep up the good work!"],
            "medium": ["Increase water intake", "Avoid skipping breakfast", "Set earlier reminder for morning medicine"],
            "high": ["Consult with a healthcare provider", "Consider a medication management service"]
        }
        return recommendations.get(adherence_risk, [])

def call_ai_hub(input_json):
    url = "https://qualcomm-ai-hub-endpoint"  # Replace with actual endpoint
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, headers=headers, data=json.dumps(input_json))
    return response.json()