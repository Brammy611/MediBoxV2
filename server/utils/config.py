import os
from datetime import timedelta

class Config:
    """Flask application configuration"""
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', '1') == '1'
    TESTING = False
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', os.getenv('SECRET_KEY', 'dev-jwt-key'))
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # MongoDB
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/medibox')
    MONGO_DB = os.getenv('MONGO_DB', 'medibox')
    
    # MQTT
    MQTT_BROKER_URL = os.getenv('MQTT_BROKER', 'broker.hivemq.com')
    MQTT_BROKER_PORT = int(os.getenv('MQTT_PORT', '1883'))
    MQTT_USERNAME = os.getenv('MQTT_USERNAME', '')
    MQTT_PASSWORD = os.getenv('MQTT_PASSWORD', '')
    MQTT_KEEPALIVE = 60
    MQTT_TLS_ENABLED = False
    
    # AI Hub
    AI_HUB_URL = os.getenv('AI_HUB_URL', 'https://placeholder.qualcomm.aihub')
    AI_HUB_API_KEY = os.getenv('AI_HUB_API_KEY', '')
    
    # CORS
    CORS_ORIGINS = ['http://localhost:5173', 'http://localhost:3000']