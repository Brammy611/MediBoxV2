from flask import Blueprint

# Initialize the routes blueprint
routes_bp = Blueprint('routes', __name__)

from . import auth, medibox, reminders, health, medicines, alerts
