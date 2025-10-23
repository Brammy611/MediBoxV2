import os
from dotenv import load_dotenv

# ✅ Load .env SEBELUM import lainnya
load_dotenv()

from flask import Flask, g, jsonify
from flask_cors import CORS
from flask_mqtt import Mqtt
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError

# Import blueprints
from routes import auth, medibox, reminders, health, medicines, alerts
from utils.config import Config

app = Flask(__name__)
app.config.from_object(Config)

print("\n" + "="*60)
print("🚀 MEDIBOX API - STARTING")
print("="*60)

# Debug: Print loaded config
print(f"✅ SECRET_KEY: {app.config['SECRET_KEY'][:10]}...")
print(f"✅ JWT_SECRET_KEY: {app.config['JWT_SECRET_KEY'][:10]}...")
print(f"✅ MONGO_URI: {app.config['MONGO_URI'][:30]}...")
print(f"✅ MONGO_DB: {app.config['MONGO_DB']}")
print(f"✅ FLASK_DEBUG: {app.config['DEBUG']}")

# CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize JWT
jwt = JWTManager(app)

# Initialize MQTT
try:
    mqtt = Mqtt(app)
    print("✅ MQTT initialized")
except Exception as e:
    print(f"⚠️ MQTT initialization failed: {e}")
    mqtt = None

# MongoDB connection
def _connect(uri: str, db_name: str | None):
    """Connect to MongoDB"""
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        
        if db_name:
            db = client.get_database(db_name)
        else:
            db = client.get_default_database()
        
        return client, db
    except Exception as e:
        raise ConnectionFailure(f"MongoDB connection failed: {e}")

# Try connecting to MongoDB
try:
    client, db = _connect(app.config['MONGO_URI'], app.config['MONGO_DB'])
    print(f"✅ MongoDB connected: {db.name}")
    active_uri = app.config['MONGO_URI']
except (ConnectionFailure, ConfigurationError) as exc:
    # Fallback to local MongoDB
    fallback_uri = "mongodb://localhost:27017/medibox"
    print(f"⚠️ Primary MongoDB failed: {exc}")
    print(f"🔄 Trying fallback: {fallback_uri}")
    
    try:
        client, db = _connect(fallback_uri, None)
        print(f"✅ MongoDB connected (fallback): {db.name}")
        active_uri = fallback_uri
    except Exception as e:
        print(f"❌ All MongoDB connections failed: {e}")
        raise

# Save to app config
app.config["MONGO_CLIENT"] = client
app.config["MONGO_DB_NAME"] = db.name
app.config["MONGO_DB"] = db
app.config["MONGO_URI_ACTIVE"] = active_uri

# Register blueprints
print("\n📋 Registering blueprints...")

try:
    # Auth blueprint
    app.register_blueprint(auth.bp)
    print(f"  ✅ {auth.bp.name:15s} → {auth.bp.url_prefix or '/'}")
    
    # Medibox blueprint
    medibox_bp = medibox.create_medibox_blueprint(db)
    app.register_blueprint(medibox_bp)
    print(f"  ✅ {medibox_bp.name:15s} → {medibox_bp.url_prefix or '/'}")
    
    # Reminders blueprint
    reminders_bp = reminders.create_reminder_blueprint(db)
    app.register_blueprint(reminders_bp)
    print(f"  ✅ {reminders_bp.name:15s} → {reminders_bp.url_prefix or '/'}")
    
    # Health blueprint
    app.register_blueprint(health.bp)
    print(f"  ✅ {health.bp.name:15s} → {health.bp.url_prefix or '/'}")
    
    # Medicines blueprint
    app.register_blueprint(medicines.bp)
    print(f"  ✅ {medicines.bp.name:15s} → {medicines.bp.url_prefix or '/'}")
    
    # Alerts blueprint
    app.register_blueprint(alerts.alerts_bp)
    print(f"  ✅ {alerts.alerts_bp.name:15s} → {alerts.alerts_bp.url_prefix or '/'}")
    
    print("✅ All blueprints registered successfully")
    
except Exception as e:
    print(f"❌ Blueprint registration failed: {e}")
    raise

# Root routes
@app.route('/')
def index():
    return {
        "message": "Welcome to the MediBox API",
        "status": "running",
        "version": "1.0.0"
    }

@app.route('/health')
def health_check():
    try:
        # Test MongoDB connection
        db.command('ping')
        db_status = "connected"
    except:
        db_status = "disconnected"
    
    return {
        "status": "ok",
        "database": db.name,
        "db_status": db_status
    }

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return {"error": "Not Found", "message": str(e)}, 404

@app.errorhandler(500)
def server_error(e):
    return {"error": "Internal Server Error", "message": str(e)}, 500

@app.route('/test-routes')
def test_routes():
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods - {'HEAD', 'OPTIONS'}),
            'path': rule.rule
        })
    return jsonify(routes)

# Print all registered routes
print("\n📍 Registered Routes:")
print("-" * 60)
routes = []
for rule in app.url_map.iter_rules():
    if rule.endpoint != 'static':
        methods = ','.join(sorted(rule.methods - {'HEAD', 'OPTIONS'}))
        routes.append(f"  {methods:8s} {rule.rule}")

# Sort and print
for route in sorted(routes):
    print(route)

print("="*60)
print(f"🌐 Server URL: http://localhost:5000")
print(f"📊 Database: {db.name}")
print(f"🔧 Debug Mode: {app.config['DEBUG']}")
print("="*60 + "\n")

# Test auth route directly
@app.route('/api/auth/test', methods=['GET', 'POST'])
def auth_test():
    if request.method == 'POST':
        data = request.get_json() or {}
        return jsonify({
            "message": "Test endpoint works!",
            "method": "POST",
            "received": data
        }), 200
    return jsonify({
        "message": "Auth test endpoint is working",
        "method": "GET"
    }), 200

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        use_reloader=True
    )