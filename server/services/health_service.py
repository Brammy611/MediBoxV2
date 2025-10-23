from datetime import datetime
from pymongo import MongoClient
from utils.config import Config

# Inisialisasi koneksi Mongo (bisa disesuaikan jika sudah ada instance di app)
client = MongoClient(Config.MONGO_URI)
db = client[Config.MONGO_DB]

class HealthService:
    @staticmethod
    def process_health_data(user_id, data):
        """
        Simpan data kesehatan (misal suhu, detak jantung, kelembapan, dll)
        """
        health_entry = {
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            "temperature": data.get("temperature"),
            "humidity": data.get("humidity"),
            "heartbeat": data.get("heartbeat"),
            "spo2": data.get("spo2"),
        }

        db.health.insert_one(health_entry)
        return {"message": "Health data recorded successfully", "data": health_entry}

    @staticmethod
    def get_health_report(user_id):
        """
        Ambil seluruh data kesehatan user berdasarkan user_id
        """
        records = list(db.health.find({"user_id": user_id}, {"_id": 0}))
        if not records:
            return None

        # Buat ringkasan laporan sederhana
        avg_temp = sum(r.get("temperature", 0) for r in records if r.get("temperature")) / len(records)
        avg_heartbeat = sum(r.get("heartbeat", 0) for r in records if r.get("heartbeat")) / len(records)

        return {
            "user_id": user_id,
            "total_records": len(records),
            "average_temperature": round(avg_temp, 2),
            "average_heartbeat": round(avg_heartbeat, 2),
            "last_record": records[-1],
        }
