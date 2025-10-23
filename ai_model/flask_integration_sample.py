import requests

def call_ai_model(user_data):
    url = "https://your-qualcomm-ai-hub-endpoint"  # Replace with your actual endpoint
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer your_token"  # Replace with your actual token if needed
    }
    
    response = requests.post(url, json=user_data, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error calling AI model: {response.status_code} - {response.text}")

# Sample user data to test the function
sample_user_data = {
    "user_id": "abc123",
    "avg_temp": 27.5,
    "avg_humidity": 70,
    "intake_pattern": 0.85,
    "missed_rate": 0.15,
    "sleep_quality": "good",
    "diet_score": 0.7
}

if __name__ == "__main__":
    try:
        result = call_ai_model(sample_user_data)
        print("AI Model Result:", result)
    except Exception as e:
        print(e)