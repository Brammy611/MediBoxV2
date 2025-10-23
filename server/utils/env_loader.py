import os
from dotenv import load_dotenv

def load_env():
    load_dotenv()

    env_vars = {
        "MONGODB_URI": os.getenv("MONGODB_URI"),
        "MQTT_BROKER": os.getenv("MQTT_BROKER"),
        "MQTT_PORT": os.getenv("MQTT_PORT"),
        "JWT_SECRET_KEY": os.getenv("JWT_SECRET_KEY"),
        "AI_HUB_ENDPOINT": os.getenv("AI_HUB_ENDPOINT"),
        "AI_HUB_API_KEY": os.getenv("AI_HUB_API_KEY"),
    }

    return env_vars