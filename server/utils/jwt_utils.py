from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
import os

# Initialize JWT Manager
jwt = JWTManager()

def create_token(identity, expires_delta=None):
    if expires_delta is None:
        expires_delta = timedelta(days=1)
    return create_access_token(identity=identity, expires_delta=expires_delta)

def get_current_user():
    return get_jwt_identity()

def jwt_required_role(role):
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user = get_current_user()
        if current_user['role'] != role:
            return {'msg': 'Access forbidden: insufficient permissions'}, 403
        return func(*args, **kwargs)
    return wrapper

def configure_jwt(app):
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your_jwt_secret_key')
    jwt.init_app(app)

# Alias agar tetap kompatibel dengan kode lama
token_required = jwt_required()
