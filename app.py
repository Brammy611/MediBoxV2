import streamlit as st
import google.generativeai as genai
from pymongo import MongoClient
from bson.json_util import dumps
import certifi
import pandas as pd
from datetime import datetime, timedelta
import pytz

def set_custom_theme():
    """Apply enhanced custom color theme with animations"""
    custom_css = """
    <style>
        /* Import Google Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        /* Global font and smooth transitions */
        * {
            font-family: 'Poppins', sans-serif;
            transition: all 0.3s ease;
        }
        
        /* Main background with gradient */
        .stApp {
            background: linear-gradient(135deg, #fef9e1 0%, #fff5d6 100%);
        }
        
        /* Enhanced header with gradient and shadow */
        .stApp > header, div[data-testid="stHeader"] {
            background: linear-gradient(90deg, #e98b1f 0%, #ff9d23 100%) !important;
            border-bottom: 3px solid #d97a0f;
            box-shadow: 0 4px 6px rgba(233, 139, 31, 0.2);
        }
        
        /* Header text styling */
        .stApp > header span, div[data-testid="stHeader"] span,
        .stApp > header div, div[data-testid="stHeader"] div {
            color: #2b2e2d !important;
            font-weight: 500;
        }
        
        /* Enhanced text styling */
        p, h1, h2, h3, h4, h5, h6, .stMarkdown, div.stText, 
        label, .st-bk, .st-c0, .stTextInput, .stDateInput, 
        .stTimeInput, .stSelectbox, span {
            color: #2b2e2d !important;
        }
        
        /* Title styling with gradient text */
        h1 {
            background: linear-gradient(135deg, #e98b1f 0%, #ff9d23 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700 !important;
            letter-spacing: -0.5px;
        }
        
        /* Subtitle styling */
        h2 {
            color: #e98b1f !important;
            font-weight: 600 !important;
            margin-top: 2rem !important;
        }
        
        /* Enhanced sidebar */
        [data-testid="stSidebar"] {
            background: linear-gradient(180deg, #fef9e1 0%, #fff5d6 100%);
            border-right: 2px solid #e98b1f;
        }
        
        [data-testid="stSidebar"] p, 
        [data-testid="stSidebar"] h1, 
        [data-testid="stSidebar"] h2, 
        [data-testid="stSidebar"] span,
        [data-testid="stSidebar"] div,
        [data-testid="stSidebar"] label, 
        [data-testid="stSidebar"] .stMarkdown {
            color: #2b2e2d !important;
        }
        
        /* Enhanced button styling with hover effects */
        .stButton button, .stDownloadButton button, button {
            background: linear-gradient(135deg, #fef9e1 0%, #fff5d6 100%) !important;
            color: #2b2e2d !important;
            border: 2px solid #e98b1f !important;
            border-radius: 12px !important;
            font-weight: 500 !important;
            padding: 0.6rem 1.5rem !important;
            box-shadow: 0 2px 4px rgba(233, 139, 31, 0.2);
            cursor: pointer;
        }
        
        .stButton button:hover, .stDownloadButton button:hover, button:hover {
            background: linear-gradient(135deg, #ff9d23 0%, #e98b1f 100%) !important;
            color: #ffffff !important;
            border-color: #d97a0f !important;
            box-shadow: 0 6px 12px rgba(233, 139, 31, 0.4);
            transform: translateY(-2px);
        }
        
        /* Primary button special styling */
        .stButton button[kind="primary"] {
            background: linear-gradient(135deg, #e98b1f 0%, #ff9d23 100%) !important;
            color: #ffffff !important;
            font-weight: 600 !important;
        }
        
        .stButton button[kind="primary"]:hover {
            background: linear-gradient(135deg, #d97a0f 0%, #e98b1f 100%) !important;
            box-shadow: 0 8px 16px rgba(233, 139, 31, 0.5);
        }
        
        /* Enhanced input fields */
        input, textarea, [data-baseweb="input"], [data-baseweb="textarea"] {
            background-color: #ffffff !important;
            color: #2b2e2d !important;
            border: 2px solid #e98b1f !important;
            border-radius: 10px !important;
            padding: 0.75rem !important;
            box-shadow: 0 2px 4px rgba(233, 139, 31, 0.1);
        }
        
        input:focus, textarea:focus {
            border-color: #ff9d23 !important;
            box-shadow: 0 0 0 3px rgba(233, 139, 31, 0.2) !important;
            outline: none !important;
        }
        
        /* Enhanced selectbox */
        .stSelectbox > div[data-baseweb="select"] > div {
            background-color: #ffffff !important;
            border: 2px solid #e98b1f !important;
            border-radius: 10px !important;
            box-shadow: 0 2px 4px rgba(233, 139, 31, 0.1);
        }
        
        .stSelectbox div[role="option"][aria-selected="true"] {
            background-color: rgba(233, 139, 31, 0.3) !important;
            color: #2b2e2d !important;
            font-weight: 500;
        }
        
        .stSelectbox div[role="option"]:hover {
            background-color: rgba(233, 139, 31, 0.15) !important;
            cursor: pointer;
        }
        
        /* Enhanced info/warning boxes */
        .stAlert {
            border-radius: 12px !important;
            border-left: 4px solid #e98b1f !important;
            box-shadow: 0 2px 8px rgba(233, 139, 31, 0.15);
        }
        
        /* Custom card styling */
        div[data-testid="stExpander"] {
            border: 2px solid #e98b1f;
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(254, 249, 225, 0.9) 0%, rgba(255, 245, 214, 0.9) 100%);
            box-shadow: 0 4px 12px rgba(233, 139, 31, 0.15);
            margin: 1rem 0;
        }
        
        div[data-testid="stExpander"]:hover {
            box-shadow: 0 6px 16px rgba(233, 139, 31, 0.25);
            transform: translateY(-2px);
        }
        
        /* Enhanced table styling */
        .stDataFrame table {
            background-color: #ffffff !important;
            border-radius: 12px !important;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(233, 139, 31, 0.15);
        }
        
        .stDataFrame th {
            background: linear-gradient(135deg, #e98b1f 0%, #ff9d23 100%) !important;
            color: #ffffff !important;
            font-weight: 600 !important;
            padding: 1rem !important;
            border: none !important;
        }
        
        .stDataFrame td {
            background-color: #ffffff !important;
            color: #2b2e2d !important;
            padding: 0.75rem !important;
            border-bottom: 1px solid rgba(233, 139, 31, 0.1) !important;
        }
        
        .stDataFrame tr:hover td {
            background-color: rgba(233, 139, 31, 0.05) !important;
        }
        
        /* Progress bar styling */
        .stProgress > div > div {
            background: linear-gradient(90deg, #e98b1f 0%, #ff9d23 100%) !important;
            border-radius: 10px;
        }
        
        /* Form styling */
        .stForm {
            background: rgba(255, 255, 255, 0.7);
            border-radius: 16px;
            padding: 2rem;
            border: 2px solid #e98b1f;
            box-shadow: 0 4px 12px rgba(233, 139, 31, 0.15);
        }
        
        /* Divider styling */
        hr {
            border-color: rgba(233, 139, 31, 0.3) !important;
            margin: 2rem 0;
        }
        
        /* Caption styling */
        .st-caption {
            color: #e98b1f !important;
            font-style: italic;
        }
        
        /* Spinner animation enhancement */
        .stSpinner > div {
            border-top-color: #e98b1f !important;
        }
        
        /* Radio button styling */
        .stRadio > label {
            background: rgba(254, 249, 225, 0.5);
            padding: 1rem;
            border-radius: 10px;
            border: 2px solid transparent;
            margin: 0.5rem 0;
            cursor: pointer;
        }
        
        .stRadio > label:hover {
            border-color: #e98b1f;
            background: rgba(233, 139, 31, 0.1);
        }
        
        /* Number input styling */
        .stNumberInput input {
            background-color: #ffffff !important;
            border: 2px solid #e98b1f !important;
            border-radius: 10px !important;
        }
        
        /* Success message styling */
        .stSuccess {
            background: linear-gradient(135deg, rgba(46, 213, 115, 0.1) 0%, rgba(72, 219, 133, 0.1) 100%) !important;
            border-left: 4px solid #2ed573 !important;
            border-radius: 12px !important;
        }
        
        /* Info message styling */
        .element-container:has(> .stAlert[data-baseweb="notification"]) {
            animation: slideIn 0.5s ease-out;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Column spacing */
        [data-testid="column"] {
            padding: 0.5rem;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        
        ::-webkit-scrollbar-track {
            background: #fef9e1;
        }
        
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #e98b1f 0%, #ff9d23 100%);
            border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #d97a0f 0%, #e98b1f 100%);
        }
    </style>
    """
    st.markdown(custom_css, unsafe_allow_html=True)

# Add this line after your imports and before any other Streamlit elements
set_custom_theme()

# Enhanced table styling
st.markdown("""
<style>
/* Comprehensive table styling */
div[data-testid="stTable"] table,
.stDataFrame table {
    background-color: #ffffff !important;
    border-radius: 12px !important;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(233, 139, 31, 0.15);
}

div[data-testid="stTable"] th,
.stDataFrame th {
    background: linear-gradient(135deg, #e98b1f 0%, #ff9d23 100%) !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    padding: 1rem !important;
    border: none !important;
}

div[data-testid="stTable"] td,
.stDataFrame td {
    background-color: #ffffff !important;
    color: #2b2e2d !important;
    padding: 0.75rem !important;
    border-bottom: 1px solid rgba(233, 139, 31, 0.1) !important;
}

div[data-testid="stTable"] tr:hover td {
    background-color: rgba(233, 139, 31, 0.05) !important;
}
</style>
""", unsafe_allow_html=True)

# ===========================
# KONFIGURASI AWAL
# ===========================
# API Key Gemini
api_key = st.secrets["GEMINI_API"]
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.0-flash')

# MongoDB Config
MONGO_URI = st.secrets["MONGO_URI"]
client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client["SentinelSIC"]
collection = db["SensorSentinel"]
boxcfg_coll = db["IdUserBox"]
reminder_collection = db["MedicineReminders"]

# Fungsi untuk mendapatkan timestamp lokal
def get_local_timestamp():
    local_tz = pytz.timezone("Asia/Jakarta")
    timestamp = datetime.now(local_tz)
    return timestamp.strftime("%Y-%m-%d %H:%M:%S")

# ===========================
# PENGATURAN SESSION STATE
# ===========================
session_defaults = {
    'page': 'login',
    'box_id': None,
    'box_cfg': {},
    'medical_history': '',
    'generated_questions': [],
    'answers': [],
    'current_question': 0,
    'sensor_history': None,
    'reset_obat_count': False,
    'show_healthy_message': False,
    'medication_schedule': None
}

for key, val in session_defaults.items():
    if key not in st.session_state:
        st.session_state[key] = val

# Check for URL parameters to auto-login
if 'box_id' in st.query_params and st.session_state.page == 'login':
    box_id = st.query_params['box_id']
    cfg = boxcfg_coll.find_one({"box_id": box_id})
    if cfg:
        st.session_state.box_id = box_id
        st.session_state.box_cfg = cfg
        st.session_state.page = 'confirm_config'
        st.rerun()
    else:
        st.error(f"❌ ID Kotak '{box_id}' tidak ditemukan dalam database.")

# ===========================
# FUNGSI PENDUKUNG
# ===========================
def get_sensor_data():
    try:
        latest = list(collection.find().sort("timestamp", -1).limit(1))
        return latest[0] if latest else None
    except Exception as e:
        st.error(f"Gagal mengambil data dari MongoDB: {str(e)}")
        return None

def get_sensor_history(limit=2000):
    try:
        records = list(collection.find().sort("timestamp", -1).limit(limit))
        records.reverse()

        filtered_changes = []
        last = {}
        medications_taken = 0
        previous_ldr = None
        last_timestamp = None
        
        box_config = None
        if st.session_state.box_id and st.session_state.box_cfg:
            box_config = st.session_state.box_cfg
            last_updated = box_config.get('last_updated')
            initial_med_count = box_config.get('Jumlah_obat', 0)
            
            if last_updated:
                if isinstance(last_updated, datetime):
                    config_last_updated = last_updated
                else:
                    try:
                        config_last_updated = datetime.fromisoformat(str(last_updated))
                    except:
                        config_last_updated = None
            else:
                config_last_updated = None
        else:
            config_last_updated = None
            initial_med_count = 0
        
        if st.session_state.reset_obat_count:
            medications_taken = 0
            st.session_state.reset_obat_count = False

        for record in records:
            changes = {}
            for key in ['temperature', 'humidity', 'ldr_value']:
                current_val = record.get(key)
                changes[key] = current_val
                last[key] = current_val

            current_ldr = record.get('ldr_value')
            
            if current_ldr >= 1000:
                changes['status_kotak'] = "TERBUKA 📂"
            else:
                changes['status_kotak'] = "TERTUTUP 📁"
            
            timestamp = record.get('timestamp')
            current_timestamp = pd.to_datetime(timestamp) if timestamp else None
            
            add_record = False
            
            if previous_ldr is None or last_timestamp is None:
                add_record = True
            elif (previous_ldr < 1000 and current_ldr >= 1000) or (previous_ldr >= 1000 and current_ldr < 1000):
                add_record = True
                if (previous_ldr < 1000 and current_ldr >= 1000 and 
                    config_last_updated and current_timestamp and 
                    current_timestamp > config_last_updated):
                    medications_taken += 1
            elif current_timestamp and last_timestamp and (current_timestamp - last_timestamp).total_seconds() >= 3600:
                add_record = True
            
            previous_ldr = current_ldr

            if timestamp:
                adjusted_timestamp = pd.to_datetime(timestamp) + timedelta(hours=7)
                changes['timestamp'] = adjusted_timestamp
            else:
                changes['timestamp'] = None

            changes['jumlah_obat_awal'] = initial_med_count
            changes['jumlah_obat_diminum'] = medications_taken
            changes['jumlah_obat_saat_ini'] = max(0, initial_med_count - medications_taken)
            
            if add_record:
                filtered_changes.append(changes)
                last_timestamp = current_timestamp

        return pd.DataFrame(filtered_changes)
    except Exception as e:
        st.error(f"Gagal mengambil riwayat sensor: {str(e)}")
        return pd.DataFrame()
    
def insert_sensor_data(temperature, humidity, ldr_value):
    sensor_data = {
        "temperature": temperature,
        "humidity": humidity,
        "ldr_value": ldr_value,
        "timestamp": get_local_timestamp()
    }
    try:
        collection.insert_one(sensor_data)
    except Exception as e:
        st.error(f"Gagal menyimpan data sensor: {str(e)}")

def reminder_page():
    """Enhanced reminder page with better styling"""
    st.title("⏰ Pengingat Obat")
    
    schedule = reminder_collection.find_one({"box_id": st.session_state.box_id, "is_active": True})
    if not schedule:
        schedule = reminder_collection.find_one({"box_id": st.session_state.box_id})
    
    if schedule:
        st.markdown("""
        <div style="padding:15px; border-radius:12px; border:2px solid #2ed573; background:linear-gradient(135deg, rgba(46, 213, 115, 0.1) 0%, rgba(72, 219, 133, 0.1) 100%); margin-bottom:20px;">
          <h3 style="color:#2ed573; margin:0; font-weight:600;">✅ Jadwal Pengingat Aktif</h3>
        </div>
        """, unsafe_allow_html=True)
        
        if "explanation" in schedule:
            st.markdown(f"""
            <div style="padding:20px; border-radius:12px; border-left:4px solid #e98b1f; background:rgba(233, 139, 31, 0.05); margin-bottom:20px;">
              <h4 style="color:#e98b1f; margin-bottom:10px;">ℹ️ Penjelasan Jadwal</h4>
              <p style="color:#2b2e2d; line-height:1.6; margin:0;">{schedule["explanation"]}</p>
            </div>
            """, unsafe_allow_html=True)
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("""
            <h3 style="color:#e98b1f; margin-bottom:15px;">💊 Jadwal Minum Obat</h3>
            """, unsafe_allow_html=True)
            
            if schedule.get("medicine_times", []):
                for entry in schedule.get("medicine_times", []):
                    st.markdown(f"""
                    <div style="padding:12px; border-radius:10px; background:rgba(233, 139, 31, 0.1); border-left:3px solid #e98b1f; margin-bottom:10px;">
                        <p style="margin:0; color:#2b2e2d;"><strong style="color:#e98b1f;">{entry['time']}</strong> - {entry['message']}</p>
                    </div>
                    """, unsafe_allow_html=True)
            else:
                st.warning("⚠️ Belum ada jadwal pengingat obat")
        
        with col2:
            st.markdown("""
            <h3 style="color:#e98b1f; margin-bottom:15px;">🍽️ Jadwal Makan</h3>
            """, unsafe_allow_html=True)
            
            if schedule.get("meal_times", []):
                for entry in schedule.get("meal_times", []):
                    st.markdown(f"""
                    <div style="padding:12px; border-radius:10px; background:rgba(46, 213, 115, 0.1); border-left:3px solid #2ed573; margin-bottom:10px;">
                        <p style="margin:0; color:#2b2e2d;"><strong style="color:#2ed573;">{entry['time']}</strong> - {entry['message']}</p>
                    </div>
                    """, unsafe_allow_html=True)
            else:
                st.warning("⚠️ Belum ada jadwal makan")
        
        try:
            reminder_collection.update_one(
                {"_id": schedule["_id"]},
                {"$set": {"last_accessed": datetime.now(pytz.timezone("Asia/Jakarta"))}}
            )
        except Exception:
            pass
        
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("🔄 Perbarui Jadwal", type="primary"):
            with st.spinner("Memperbarui jadwal..."):
                new_schedule = generate_and_save_medicine_schedule(
                    st.session_state.medical_history or schedule.get("medical_history", ""),
                    st.session_state.box_cfg
                )
                if new_schedule:
                    st.session_state.medication_schedule = new_schedule
                    st.success("✅ Jadwal berhasil diperbarui!")
                    st.rerun()
    else:
        st.markdown("""
        <div style="padding:20px; border-radius:12px; border:2px solid #ffa502; background:rgba(255, 165, 2, 0.1); text-align:center;">
          <h3 style="color:#ffa502; margin:0;">⚠️ Belum Ada Jadwal Pengingat</h3>
          <p style="color:#2b2e2d; margin-top:10px;">Buat jadwal pengingat untuk membantu Anda mengingat waktu minum obat</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("➕ Buat Jadwal Baru", type="primary"):
            with st.spinner("Membuat jadwal pengingat..."):
                new_schedule = generate_and_save_medicine_schedule(
                    st.session_state.medical_history or f"Pasien dengan {st.session_state.box_cfg.get('nama_penyakit', '')}",
                    st.session_state.box_cfg
                )
                if new_schedule:
                    st.session_state.medication_schedule = new_schedule
                    st.success("✅ Jadwal berhasil dibuat!")
                    st.rerun()

def generate_medical_questions(history, sensor_data=None):
    """Generate medical questions based on history and sensor data"""
    
    sensor_info = ""
    if sensor_data is not None:
        sensor_info = f"""
        Data Sensor Terbaru:
        - Suhu: {sensor_data.get('temperature', 'N/A')} °C
        - Kelembaban: {sensor_data.get('humidity', 'N/A')}%
        - Nilai LDR (Intensitas Cahaya): {sensor_data.get('ldr_value', 'N/A')}
        """
    
    prompt = f"""
    Anda adalah dokter profesional. Buat 3-5 pertanyaan dengan jawaban ya atau tidak spesifik tentang gejala 
    yang mungkin terkait dengan riwayat penyakit berikut dan data terbaru:
    
    Riwayat Pasien: {history}
    {sensor_info}
    
    Format output:
    - Apakah Anda mengalami [gejala spesifik]?
    - Apakah Anda merasa [gejala spesifik]?
    
    Perhatikan data dalam membuat pertanyaan yang relevan.
    Asumsikan data selain yang tersedia di atas adalah normal.
    
    Hanya berikan list pertanyaan tanpa penjelasan tambahan.
    """
    try:
        response = model.generate_content(prompt)
        questions = response.text.split('\n')
        return [q.strip() for q in questions if q.strip() and q.startswith('-')]
    except Exception as e:
        st.error(f"Gagal membuat pertanyaan: {str(e)}")
        return []
    
def generate_recommendations():
    """Generate personalized recommendations based on configuration data"""
    try:
        cfg = st.session_state.box_cfg or {}
        
        config_info = f"""
        4. Informasi Kotak Medibox:
           - Nama Pengguna: {cfg.get('nama', 'Tidak diatur')}
           - Penyakit/Kondisi: {cfg.get('nama_penyakit', 'Tidak diatur')}
           - Nama Obat: {cfg.get('medication_name', 'Tidak diatur')}
           - Jumlah Obat: {cfg.get('Jumlah_obat', 0)}
           - Usia Pasien: {cfg.get('usia', 'Tidak diatur')} tahun
           - Jenis Kelamin Pasien: {cfg.get('jenis_kelamin', 'Tidak diatur')}
           - Riwayat Alergi: {cfg.get('riwayat_alergi', 'Tidak diatur')}
           - Aturan Penyimpanan: {cfg.get('storage_rules', 'Tidak diatur')}
           - Aturan Minum: {cfg.get('dosage_rules', 'Tidak diatur')}
        """
        
        catatan_apoteker = cfg.get('catatan_apoteker', '')
        if catatan_apoteker and catatan_apoteker.strip():
            config_info += f"           - Catatan Apoteker: {catatan_apoteker}"
        
        history = st.session_state.medical_history or "Tidak ada riwayat"
        symptoms = "\n".join([
            f"{q} - {'Ya' if a else 'Tidak'}" 
            for q, a in zip(st.session_state.generated_questions, st.session_state.answers)
        ])
        
        prompt = f"""
        Analisis riwayat medis, gejala, dan informasi konfigurasi obat berikut:
        
        1. Riwayat Medis: {history}
        2. Gejala:
        {symptoms}
        {config_info}
        
        Berikan rekomendasi dalam Bahasa Indonesia dengan format:
        - Analisis kondisi kesehatan
        - Evaluasi kesesuaian penggunaan obat dengan kondisi pasien
        - Tindakan medis yang diperlukan
        - Langkah pencegahan
        - Rekomendasi dokter spesialis (jika perlu)
        - Tips perawatan mandiri
        
        Pertimbangkan informasi konfigurasi obat dalam analisis Anda.
        Gunakan format markdown dengan poin-point jelas.
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        st.error(f"Error generating recommendations: {str(e)}")
        return None

def display_header_with_logo():
    """Display enhanced MediBox header"""
    st.markdown("""
        <div style="padding:20px 0; margin-bottom:20px; text-align:center;">
            <h1 style="font-size:3rem; margin:0; background:linear-gradient(135deg, #e98b1f 0%, #ff9d23 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; font-weight:700;">
                🏥 MediBox
            </h1>
            <p style="color:#e98b1f; font-size:1.1rem; margin-top:5px; font-weight:500;">Smart Medicine Management System</p>
        </div>
        """, unsafe_allow_html=True)
        
def generate_diet_plan(history):
    """Generate diet recommendations based on medical history"""
    cfg = st.session_state.box_cfg or {}
    nama = cfg.get('nama', '')
    usia = cfg.get('usia')
    jenis_kelamin = cfg.get('jenis_kelamin')
    riwayat_alergi = cfg.get('riwayat_alergi', 'Tidak ada')
    
    prompt = f"""
    Anda adalah ahli gizi profesional. Berdasarkan riwayat penyakit/kondisi medis berikut,
    rekomendasikan pola makan harian dengan daftar makanan dan kandungan nutrisinya.

    Nama Pasien: {nama}
    Riwayat Pasien: {history}
    Usia Pasien: {usia} tahun
    Jenis Kelamin Pasien: {jenis_kelamin}
    Riwayat Alergi: {riwayat_alergi}

    Format output:
    - Makanan: [nama makanan] - Kandungan: [kalori, protein, lemak, karbohidrat, vitamin/mineral]
    - Sajikan 3-5 rekomendasi makanan utama.
    - Hindari makanan yang dapat memicu alergi pasien.
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        st.error(f"Error generating diet plan: {str(e)}")
        return "Tidak dapat membuat rekomendasi pola makan saat ini."

# ===========================
# HALAMAN LOGIN DAN KONFIGURASI
# ===========================
def login_page():
    st.markdown("""
        <div style="text-align:center; padding:40px 0;">
            <h1 style="font-size:3.5rem; margin:0; background:linear-gradient(135deg, #e98b1f 0%, #ff9d23 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; font-weight:700;">
                🏥 MediBox
            </h1>
            <p style="color:#e98b1f; font-size:1.3rem; margin-top:10px; font-weight:500;">Smart Medicine Management System</p>
        </div>
    """, unsafe_allow_html=True)
    
    st.markdown("<h2 style='text-align:center; color:#e98b1f;'>🔐 Login Kotak Obat</h2>", unsafe_allow_html=True)
    
    with st.form("login_form"):
        box_id = st.text_input("Masukkan ID Kotak", placeholder="Contoh: BOX001")
        submitted = st.form_submit_button("🚀 Masuk", type="primary")
        if submitted:
            if not box_id.strip():
                st.warning("⚠️ ID tidak boleh kosong")
            else:
                cfg = boxcfg_coll.find_one({"box_id": box_id})
                if cfg is None:
                    st.error("❌ ID Kotak tidak terdaftar. Silakan periksa kembali ID anda.")
                else:
                    st.session_state.box_id = box_id
                    st.session_state.box_cfg = cfg
                    st.session_state.page = 'confirm_config'
                    st.rerun()

def confirm_config_page():
    """Enhanced configuration confirmation page"""
    st.markdown("""
        <div style="text-align:center; padding:20px; background:linear-gradient(135deg, rgba(46, 213, 115, 0.1) 0%, rgba(72, 219, 133, 0.1) 100%); border-radius:16px; border:2px solid #2ed573; margin-bottom:30px;">
            <h2 style="color:#2ed573; margin:0; font-weight:600;">✅ Berhasil Masuk MediBox</h2>
        </div>
    """, unsafe_allow_html=True)
    
    cfg = st.session_state.box_cfg
    
    nama = cfg.get('nama', '')
    nama_penyakit = cfg.get('nama_penyakit', '')
    medication_name = cfg.get('medication_name', '')
    usia = cfg.get('usia', None)
    jenis_kelamin = cfg.get('jenis_kelamin', '')
    storage_rules = cfg.get('storage_rules', '')
    dosage_rules = cfg.get('dosage_rules', '')
    jumlah_obat = cfg.get('Jumlah_obat', None)
    
    is_condition_set = (
        nama and nama.strip() != '' and nama.lower() != 'belum diatur'
        and nama_penyakit and nama_penyakit.strip() != '' and nama_penyakit.lower() != 'belum diatur'
        and medication_name and medication_name.strip() != '' and medication_name.lower() != 'belum diatur'
        and usia is not None
        and jenis_kelamin and jenis_kelamin.strip() != '' and jenis_kelamin.lower() != 'belum diatur'
        and storage_rules and storage_rules.strip() != '' and storage_rules.lower() != 'belum diatur'
        and dosage_rules and dosage_rules.strip() != '' and dosage_rules.lower() != 'belum diatur'
        and jumlah_obat is not None and jumlah_obat >= 0
    )
    
    st.markdown("""
        <div style="padding:20px; background:rgba(233, 139, 31, 0.05); border-radius:12px; border-left:4px solid #e98b1f; margin-bottom:20px;">
            <h3 style="color:#e98b1f; margin-top:0;">📋 Informasi Saat Ini</h3>
        </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        info_items = [
            ("👤", "Nama Pengguna", cfg.get('nama', 'Belum diatur')),
            ("🏥", "Penyakit/Kondisi", cfg.get('nama_penyakit', 'Belum diatur')),
            ("💊", "Nama Obat", cfg.get('medication_name', 'Belum diatur')),
            ("📦", "Jumlah Obat", str(cfg.get('Jumlah_obat', 0))),
        ]
        for icon, label, value in info_items:
            st.markdown(f"""
                <div style="padding:10px; margin:5px 0; background:white; border-radius:8px; border-left:3px solid #e98b1f;">
                    <p style="margin:0; color:#2b2e2d;"><strong>{icon} {label}:</strong> {value}</p>
                </div>
            """, unsafe_allow_html=True)
    
    with col2:
        info_items = [
            ("🎂", "Usia", f"{cfg.get('usia', 'Belum diatur')} tahun" if cfg.get('usia') else 'Belum diatur'),
            ("👥", "Jenis Kelamin", cfg.get('jenis_kelamin', 'Belum diatur')),
            ("⚠️", "Riwayat Alergi", cfg.get('riwayat_alergi', 'Belum diatur')),
        ]
        for icon, label, value in info_items:
            st.markdown(f"""
                <div style="padding:10px; margin:5px 0; background:white; border-radius:8px; border-left:3px solid #e98b1f;">
                    <p style="margin:0; color:#2b2e2d;"><strong>{icon} {label}:</strong> {value}</p>
                </div>
            """, unsafe_allow_html=True)
        
        catatan_apoteker = cfg.get('catatan_apoteker', '')
        if catatan_apoteker and catatan_apoteker.strip():
            st.markdown(f"""
                <div style="padding:10px; margin:5px 0; background:white; border-radius:8px; border-left:3px solid #e98b1f;">
                    <p style="margin:0; color:#2b2e2d;"><strong>📝 Catatan Apoteker:</strong> {catatan_apoteker}</p>
                </div>
            """, unsafe_allow_html=True)
        
        last_updated = cfg.get('last_updated', None)
        if last_updated:
            try:
                if isinstance(last_updated, datetime):
                    last_updated_str = (last_updated + timedelta(hours=7)).strftime("%d %b %Y, %H:%M")
                else:
                    last_updated_str = (datetime.fromisoformat(str(last_updated)) + timedelta(hours=7)).strftime("%d %b %Y, %H:%M")
            except:
                last_updated_str = str(last_updated)
            st.markdown(f"""
                <div style="padding:10px; margin:5px 0; background:white; border-radius:8px; border-left:3px solid #e98b1f;">
                    <p style="margin:0; color:#2b2e2d;"><strong>🕒 Terakhir Diperbarui:</strong> {last_updated_str}</p>
                </div>
            """, unsafe_allow_html=True)
    
    if not is_condition_set:
        st.warning("⚠️ Informasi belum lengkap. Anda perlu mengatur semua informasi terlebih dahulu.")
    
    st.markdown("<br>", unsafe_allow_html=True)
    col1, col2 = st.columns(2)
    with col1:
        if st.button("✏️ Ubah Informasi", type="primary", use_container_width=True):
            st.session_state.page = 'config'
            st.rerun()
    
    with col2:
        if is_condition_set:
            if st.button("➡️ Langsung ke Aplikasi", use_container_width=True):
                st.session_state.page = 'main'
                st.rerun()

def config_page():
    st.title(f"⚙️ Informasi Kotak Obat")
    cfg = st.session_state.box_cfg or {}
    
    st.markdown("""
        <div style="padding:15px; background:rgba(233, 139, 31, 0.1); border-radius:12px; border-left:4px solid #e98b1f; margin-bottom:20px;">
            <p style="margin:0; color:#2b2e2d;">Lengkapi informasi berikut untuk pengalaman terbaik dengan MediBox</p>
        </div>
    """, unsafe_allow_html=True)
    
    with st.form("cfg_form"):
        st.subheader("👤 Informasi Pribadi")
        col1, col2 = st.columns(2)
        with col1:
            nama = st.text_input("Nama Pengguna", 
                               value=cfg.get("nama", ""),
                               help="Nama lengkap pengguna kotak obat")
            usia = st.number_input("Usia", 
                                min_value=0, 
                                max_value=120, 
                                value=cfg.get("usia", 30),
                                help="Usia pengguna kotak obat")
        with col2:
            gender_options = ["Laki-laki", "Perempuan"]
            default_idx = 0
            if "jenis_kelamin" in cfg:
                if cfg["jenis_kelamin"] in gender_options:
                    default_idx = gender_options.index(cfg["jenis_kelamin"])
            jenis_kelamin = st.selectbox("Jenis Kelamin", 
                                       options=gender_options,
                                       index=default_idx)
            riwayat_alergi = st.text_input("Riwayat Alergi", 
                                          value=cfg.get("riwayat_alergi", ""),
                                          help="Daftar alergi yang dimiliki")
        
        st.subheader("💊 Informasi Obat")
        col1, col2 = st.columns(2)
        with col1:
            nama_penyakit = st.text_input("Nama Penyakit/Kondisi", 
                                         value=cfg.get("nama_penyakit", ""),
                                         help="Kondisi medis yang sedang ditangani")
            med_name = st.text_input("Nama Obat", value=cfg.get("medication_name", ""))
        with col2:
            Jumlah_obat = st.number_input("Jumlah Obat", 
                                        min_value=0, 
                                        value=cfg.get("Jumlah_obat", 0),
                                        help="Jumlah obat dalam kotak")
        
        st.subheader("📋 Aturan Penggunaan")
        storage = st.text_area("Aturan Penyimpanan", value=cfg.get("storage_rules", ""), height=80)
        dosage = st.text_area("Aturan Minum", value=cfg.get("dosage_rules", ""), height=80)
        catatan_apoteker = st.text_area("Catatan Apoteker", 
                                       value=cfg.get("catatan_apoteker", ""),
                                       help="Catatan khusus dari apoteker (opsional)",
                                       height=100)
        
        submitted = st.form_submit_button("💾 Simpan Informasi", type="primary")
        if submitted:
            now = datetime.now(pytz.timezone("Asia/Jakarta"))
            
            updated_cfg = {
                "nama": nama,
                "nama_penyakit": nama_penyakit,
                "medication_name": med_name,
                "storage_rules": storage,
                "dosage_rules": dosage,
                "Jumlah_obat": int(Jumlah_obat),
                "usia": int(usia),
                "jenis_kelamin": jenis_kelamin,
                "riwayat_alergi": riwayat_alergi,
                "catatan_apoteker": catatan_apoteker,
                "last_updated": now
            }
            
            boxcfg_coll.update_one(
                {"box_id": st.session_state.box_id},
                {"$set": updated_cfg},
                upsert=True
            )
            
            st.session_state.box_cfg = {**st.session_state.box_cfg, **updated_cfg}
            
            with st.spinner("Membuat jadwal pengingat obat..."):
                medical_history = st.session_state.medical_history or f"Pasien dengan {nama_penyakit}" 
                
                schedule = generate_and_save_medicine_schedule_from_config(
                    medical_history=medical_history,
                    box_cfg=st.session_state.box_cfg
                )
                
                if schedule:
                    st.session_state.medication_schedule = schedule
                    st.success("✅ Informasi dan jadwal pengingat berhasil dibuat dan disimpan!")
                else:
                    st.success("✅ Informasi disimpan, tetapi jadwal pengingat gagal dibuat.")
            
            st.session_state.page = 'main'
            st.rerun()

# ===========================
# HALAMAN APLIKASI
# ===========================
def main_page():
    cfg = st.session_state.box_cfg
    if cfg:
        nama = cfg.get('nama', '')
        jenis_kelamin = cfg.get('jenis_kelamin', '')
        
        if nama:
            title_prefix = "Nyonya" if jenis_kelamin == "Perempuan" else "Tuan"
            st.markdown(f"""
                <div style="text-align:center; padding:20px; background:linear-gradient(135deg, rgba(233, 139, 31, 0.1) 0%, rgba(255, 157, 35, 0.1) 100%); border-radius:16px; margin-bottom:20px;">
                    <h2 style="color:#e98b1f; margin:0;">👋 Selamat Datang, {title_prefix} {nama}!</h2>
                </div>
            """, unsafe_allow_html=True)
    
    st.title("🩺 Aplikasi Pemeriksaan Kesehatan")
    
    if cfg:
        st.markdown("""
            <div style="padding:20px; background:linear-gradient(135deg, rgba(233, 139, 31, 0.05) 0%, rgba(255, 157, 35, 0.05) 100%); border-radius:16px; border:2px solid #e98b1f; margin-bottom:20px;">
                <h3 style="color:#e98b1f; margin-top:0;">💊 Informasi Obat</h3>
        """, unsafe_allow_html=True)
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.markdown(f"""
                <div style="padding:15px; background:white; border-radius:10px; text-align:center; box-shadow:0 2px 8px rgba(233,139,31,0.1);">
                    <p style="color:#e98b1f; font-size:2rem; margin:0;">👤</p>
                    <p style="color:#2b2e2d; margin:5px 0; font-weight:500;">{cfg.get('nama', 'N/A')}</p>
                    <p style="color:#999; font-size:0.9rem; margin:0;">Pengguna</p>
                </div>
            """, unsafe_allow_html=True)
        with col2:
            st.markdown(f"""
                <div style="padding:15px; background:white; border-radius:10px; text-align:center; box-shadow:0 2px 8px rgba(233,139,31,0.1);">
                    <p style="color:#e98b1f; font-size:2rem; margin:0;">💊</p>
                    <p style="color:#2b2e2d; margin:5px 0; font-weight:500;">{cfg.get('medication_name', 'N/A')}</p>
                    <p style="color:#999; font-size:0.9rem; margin:0;">Obat</p>
                </div>
            """, unsafe_allow_html=True)
        with col3:
            st.markdown(f"""
                <div style="padding:15px; background:white; border-radius:10px; text-align:center; box-shadow:0 2px 8px rgba(233,139,31,0.1);">
                    <p style="color:#e98b1f; font-size:2rem; margin:0;">📦</p>
                    <p style="color:#2b2e2d; margin:5px 0; font-weight:500;">{cfg.get('Jumlah_obat', 0)}</p>
                    <p style="color:#999; font-size:0.9rem; margin:0;">Jumlah</p>
                </div>
            """, unsafe_allow_html=True)
        
        st.markdown("</div>", unsafe_allow_html=True)
    
    if st.button("⚙️ Ganti Informasi Pengguna", key="change_box"): 
        st.session_state.page = 'config'
        if 'sensor_history' in st.session_state:
            st.session_state.pop('sensor_history', None)
        st.rerun()
    
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("""
        <div style="text-align:center; padding:30px; background:linear-gradient(135deg, rgba(233, 139, 31, 0.05) 0%, rgba(255, 157, 35, 0.05) 100%); border-radius:16px;">
            <h2 style="color:#e98b1f; margin-bottom:20px;">Apakah kamu merasa sakit hari ini?</h2>
        </div>
    """, unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    c1, c2 = st.columns(2)
    with c1:
        if st.button("✅ Ya, Saya Sakit", type="primary", use_container_width=True): 
            st.session_state.page = 'medical_history'
            st.rerun()
    with c2:
        if st.button("❌ Tidak, Saya Sehat", use_container_width=True): 
            st.session_state.show_healthy_message = True
            st.rerun()
    
    if st.session_state.show_healthy_message:
        st.markdown("""
            <div style="padding:20px; background:linear-gradient(135deg, rgba(46, 213, 115, 0.1) 0%, rgba(72, 219, 133, 0.1) 100%); border-radius:12px; border:2px solid #2ed573; text-align:center; margin-top:20px;">
                <h3 style="color:#2ed573; margin:0;">🎉 Bagus! Tetap jaga kesehatan...</h3>
            </div>
        """, unsafe_allow_html=True)
        if st.button("✖️ Tutup Pesan", key="close_message"):
            st.session_state.show_healthy_message = False
            st.rerun()

def medical_history_page():
    """Enhanced medical history page"""
    st.title("📋 Riwayat Medis")
    
    cfg = st.session_state.box_cfg
    
    if cfg:
        with st.expander("📦 Informasi Kotak Medibox", expanded=True):
            col1, col2 = st.columns(2)
            with col1:
                info_items = [
                    ("👤 Nama Pengguna", cfg.get('nama', 'Belum diatur')),
                    ("🏥 Penyakit/Kondisi", cfg.get('nama_penyakit', 'Belum diatur')),
                    ("💊 Nama Obat", cfg.get('medication_name', 'Belum diatur')),
                    ("📦 Jumlah Obat", str(cfg.get('Jumlah_obat', 0))),
                ]
                for label, value in info_items:
                    st.markdown(f"**{label}:** {value}")
            
            with col2:
                info_items = [
                    ("🎂 Usia", f"{cfg.get('usia', 'Belum diatur')} tahun" if cfg.get('usia') else 'Belum diatur'),
                    ("👥 Jenis Kelamin", cfg.get('jenis_kelamin', 'Belum diatur')),
                    ("⚠️ Riwayat Alergi", cfg.get('riwayat_alergi', 'Belum diatur')),
                ]
                for label, value in info_items:
                    st.markdown(f"**{label}:** {value}")
                
                st.markdown("**📋 Aturan Minum:**")
                st.markdown(f"{cfg.get('dosage_rules', 'Belum diatur')}")
    
    st.markdown("<br>", unsafe_allow_html=True)
    with st.form("medical_form"):
        st.markdown("""
            <div style="padding:15px; background:rgba(233, 139, 31, 0.1); border-radius:12px; border-left:4px solid #e98b1f; margin-bottom:20px;">
                <p style="margin:0; color:#2b2e2d; font-weight:500;">Mohon isi informasi berikut!</p>
            </div>
        """, unsafe_allow_html=True)
        
        history = st.text_area(
            "Riwayat penyakit/kondisi medis yang pernah dimiliki:",
            height=150,
            key="medical_history",
            placeholder="Contoh: Saya memiliki riwayat hipertensi dan diabetes..."
        )
        
        if st.form_submit_button("🚀 Lanjutkan", type="primary"):
            if history.strip():
                questions = generate_medical_questions(history)
                if questions:
                    st.session_state.generated_questions = questions
                    st.session_state.page = 'questioning'
                    st.session_state.current_question = 0
                    st.session_state.answers = []
                    st.rerun()
                else:
                    st.error("Gagal membuat pertanyaan. Silakan coba lagi.")
            else:
                st.warning("⚠️ Mohon isi riwayat medis Anda terlebih dahulu")
    
    if st.button("« Kembali ke Halaman Utama", key="back_to_main"):
        st.session_state.page = 'main'
        st.rerun()

def questioning_page():
    """Enhanced questioning page"""
    st.title("🔍 Pemeriksaan Gejala")
    idx = st.session_state.current_question
    qs = st.session_state.generated_questions
    
    if idx < len(qs):
        st.markdown(f"""
            <div style="text-align:center; padding:15px; background:rgba(233, 139, 31, 0.05); border-radius:12px; margin-bottom:20px;">
                <h3 style="color:#e98b1f; margin:0;">Pertanyaan {idx+1} dari {len(qs)}</h3>
            </div>
        """, unsafe_allow_html=True)
        
        st.progress((idx+1)/len(qs))
        
        st.markdown(f"""
            <div style="padding:30px; background:white; border-radius:16px; border:2px solid #e98b1f; box-shadow:0 4px 12px rgba(233,139,31,0.15); margin:20px 0;">
                <p style="font-size:1.3rem; color:#2b2e2d; text-align:center; margin:0; font-weight:500;">{qs[idx].replace('-', '•')}</p>
            </div>
        """, unsafe_allow_html=True)
        
        col1, col2 = st.columns(2)
        if col1.button("✅ Ya", key=f"yes_{idx}", type="primary", use_container_width=True):
            st.session_state.answers.append(True)
            st.session_state.current_question += 1
            if st.session_state.current_question >= len(qs):
                st.session_state.page = 'results'
            st.rerun()
        if col2.button("❌ Tidak", key=f"no_{idx}", use_container_width=True):
            st.session_state.answers.append(False)
            st.session_state.current_question += 1
            if st.session_state.current_question >= len(qs):
                st.session_state.page = 'results'
            st.rerun()
    else:
        st.session_state.page = 'results'
        st.rerun()

def results_page():
    """Enhanced results page"""
    st.title("📝 Hasil Analisis")
    
    cfg = st.session_state.box_cfg or {}
    jenis_kelamin = cfg.get('jenis_kelamin', '')
    title_prefix = "Nyonya" if jenis_kelamin == "Perempuan" else "Tuan"
    
    with st.spinner(f"🔄 Mohon tunggu sebentar {title_prefix}..."):
        rec = generate_recommendations()
        diet_plan = generate_diet_plan(st.session_state.medical_history)
        
        medication_schedule = generate_and_save_medicine_schedule(
            st.session_state.medical_history,
            st.session_state.box_cfg
        )
        
        if medication_schedule:
            st.session_state.medication_schedule = medication_schedule
    
    if rec:
        st.markdown("""
            <div style="padding:15px; background:linear-gradient(135deg, rgba(233, 139, 31, 0.1) 0%, rgba(255, 157, 35, 0.1) 100%); border-radius:12px; border-left:4px solid #e98b1f; margin-bottom:20px;">
                <h3 style="color:#e98b1f; margin:0;">📋 Rekomendasi Medis</h3>
            </div>
        """, unsafe_allow_html=True)
        st.markdown(rec)
    
    if diet_plan:
        st.markdown("""
            <div style="padding:15px; background:linear-gradient(135deg, rgba(46, 213, 115, 0.1) 0%, rgba(72, 219, 133, 0.1) 100%); border-radius:12px; border-left:4px solid #2ed573; margin-bottom:20px; margin-top:30px;">
                <h3 style="color:#2ed573; margin:0;">🍎 Rekomendasi Pola Makan</h3>
            </div>
        """, unsafe_allow_html=True)
        st.markdown(diet_plan)
    
    if medication_schedule:
        st.markdown("""
            <div style="padding:15px; background:linear-gradient(135deg, rgba(255, 165, 2, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%); border-radius:12px; border-left:4px solid #ffa502; margin-bottom:20px; margin-top:30px;">
                <h3 style="color:#ffa502; margin:0;">⏰ Jadwal Pengingat Obat</h3>
            </div>
        """, unsafe_allow_html=True)
        
        st.success("✅ Jadwal pengingat obat telah dibuat berdasarkan kondisi Anda")
        
        with st.expander("📅 Lihat Jadwal Lengkap", expanded=True):
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("**💊 Waktu Minum Obat:**")
                for time_entry in medication_schedule.get("medicine_times", []):
                    st.info(f"• **{time_entry['time']}** - {time_entry['message']}")
            
            with col2:
                st.markdown("**🍽️ Waktu Makan:**")
                for time_entry in medication_schedule.get("meal_times", []):
                    st.success(f"• **{time_entry['time']}** - {time_entry['message']}")
        
        if st.button("⏰ Kelola Jadwal Pengingat", type="primary"):
            st.session_state.page = 'reminders'
            st.rerun()
    
    st.markdown("<br>", unsafe_allow_html=True)
    if st.button("🏠 Kembali ke Halaman Utama", use_container_width=True):
        st.session_state.page = 'main'
        st.rerun()

def sensor_history_page():
    """Enhanced sensor history page"""
    st.title("📚 Riwayat Perubahan Sensor")
    
    col1, col2 = st.columns([3, 1])
    with col2:
        if st.button("🔃 Refresh Data", type="primary"):
            st.session_state.sensor_history = get_sensor_history()
            st.success("✅ Data berhasil diperbarui!")
    
    with st.spinner("⏳ Memuat data sensor..."):
        if st.session_state.sensor_history is None:
            st.session_state.sensor_history = get_sensor_history()
    
    df = st.session_state.sensor_history
    if df is not None and not df.empty:
        last_updated = None
        if st.session_state.box_cfg and 'last_updated' in st.session_state.box_cfg:
            last_updated_raw = st.session_state.box_cfg['last_updated']
            if isinstance(last_updated_raw, datetime):
                last_updated = last_updated_raw
            else:
                try:
                    last_updated = datetime.fromisoformat(str(last_updated_raw))
                except:
                    last_updated = None
        
        if last_updated and 'timestamp' in df.columns:
            adjusted_last_updated = last_updated + timedelta(hours=7)
            filtered_df = df[df['timestamp'] > adjusted_last_updated]
            
            st.markdown(f"""
                <div style="padding:15px; background:rgba(233, 139, 31, 0.1); border-radius:12px; border-left:4px solid #e98b1f; margin-bottom:20px;">
                    <p style="margin:0; color:#2b2e2d;">📅 Menampilkan data setelah: <strong>{adjusted_last_updated.strftime('%d %b %Y, %H:%M')}</strong></p>
                </div>
            """, unsafe_allow_html=True)
            
            if filtered_df.empty:
                st.warning("⚠️ Tidak ada data sensor baru sejak perubahan terakhir.")
            else:
                if 'jumlah_obat_saat_ini' in filtered_df.columns:
                    latest_row = filtered_df.iloc[-1]
                    jumlah_awal = latest_row.get('jumlah_obat_awal', 0)
                    obat_diminum = latest_row.get('jumlah_obat_diminum', 0)
                    obat_saat_ini = latest_row.get('jumlah_obat_saat_ini', 0)
                    
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.markdown(f"""
                            <div style="padding:20px; background:white; border-radius:12px; text-align:center; box-shadow:0 4px 12px rgba(233,139,31,0.15);">
                                <p style="color:#e98b1f; font-size:2.5rem; margin:0;">📦</p>
                                <h2 style="color:#2b2e2d; margin:10px 0;">{jumlah_awal}</h2>
                                <p style="color:#999; margin:0;">Jumlah Awal</p>
                            </div>
                        """, unsafe_allow_html=True)
                    with col2:
                        st.markdown(f"""
                            <div style="padding:20px; background:white; border-radius:12px; text-align:center; box-shadow:0 4px 12px rgba(233,139,31,0.15);">
                                <p style="color:#e98b1f; font-size:2.5rem; margin:0;">💊</p>
                                <h2 style="color:#2b2e2d; margin:10px 0;">{obat_diminum}</h2>
                                <p style="color:#999; margin:0;">Obat Diminum</p>
                            </div>
                        """, unsafe_allow_html=True)
                    with col3:
                        st.markdown(f"""
                            <div style="padding:20px; background:white; border-radius:12px; text-align:center; box-shadow:0 4px 12px rgba(233,139,31,0.15);">
                                <p style="color:#2ed573; font-size:2.5rem; margin:0;">✅</p>
                                <h2 style="color:#2b2e2d; margin:10px 0;">{obat_saat_ini}</h2>
                                <p style="color:#999; margin:0;">Sisa Obat</p>
                            </div>
                        """, unsafe_allow_html=True)
                
                st.markdown("<br>", unsafe_allow_html=True)
                display_columns = [col for col in filtered_df.columns if col not in 
                                  ['jumlah_obat_awal', 'jumlah_obat_diminum']]
                
                display_df = filtered_df[display_columns].copy()
                if 'jumlah_obat_saat_ini' in display_df.columns:
                    display_df = display_df.rename(columns={'jumlah_obat_saat_ini': 'sisa_obat'})
                
                display_df = display_df.sort_values(by="timestamp", ascending=False)
                display_df = display_df.style.set_properties(**{
                    'background-color': '#ffffff',
                    'color': '#2b2e2d',
                    'border': '1px solid rgba(233, 139, 31, 0.2)'
                }).set_table_styles([
                    {'selector': 'th', 
                    'props': [('background', 'linear-gradient(135deg, #e98b1f 0%, #ff9d23 100%)'), 
                            ('color', '#ffffff'),
                            ('font-weight', 'bold'),
                            ('border', 'none')]},
                    {'selector': 'th.row_heading',
                    'props': [('background-color', '#fef9e1'),
                            ('color', '#2b2e2d'),
                            ('border', '1px solid rgba(233, 139, 31, 0.2)')]},
                    {'selector': 'th.col_heading.level0.index_name',
                    'props': [('background-color', '#fef9e1'),
                            ('color', '#2b2e2d'),
                            ('border', '1px solid rgba(233, 139, 31, 0.2)')]}
                ])
                
                st.dataframe(display_df, use_container_width=True)
        else:
            if 'jumlah_obat_saat_ini' in df.columns:
                latest_row = df.iloc[-1]
                jumlah_awal = latest_row.get('jumlah_obat_awal', 0)
                obat_diminum = latest_row.get('jumlah_obat_diminum', 0)
                obat_saat_ini = latest_row.get('jumlah_obat_saat_ini', 0)
                
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.markdown(f"""
                        <div style="padding:20px; background:white; border-radius:12px; text-align:center; box-shadow:0 4px 12px rgba(233,139,31,0.15);">
                            <p style="color:#e98b1f; font-size:2.5rem; margin:0;">📦</p>
                            <h2 style="color:#2b2e2d; margin:10px 0;">{jumlah_awal}</h2>
                            <p style="color:#999; margin:0;">Jumlah Awal</p>
                        </div>
                    """, unsafe_allow_html=True)
                with col2:
                    st.markdown(f"""
                        <div style="padding:20px; background:white; border-radius:12px; text-align:center; box-shadow:0 4px 12px rgba(233,139,31,0.15);">
                            <p style="color:#e98b1f; font-size:2.5rem; margin:0;">💊</p>
                            <h2 style="color:#2b2e2d; margin:10px 0;">{obat_diminum}</h2>
                            <p style="color:#999; margin:0;">Obat Diminum</p>
                        </div>
                    """, unsafe_allow_html=True)
                with col3:
                    st.markdown(f"""
                        <div style="padding:20px; background:white; border-radius:12px; text-align:center; box-shadow:0 4px 12px rgba(233,139,31,0.15);">
                            <p style="color:#2ed573; font-size:2.5rem; margin:0;">✅</p>
                            <h2 style="color:#2b2e2d; margin:10px 0;">{obat_saat_ini}</h2>
                            <p style="color:#999; margin:0;">Sisa Obat</p>
                        </div>
                    """, unsafe_allow_html=True)
            
            st.markdown("<br>", unsafe_allow_html=True)
            display_columns = [col for col in df.columns if col not in 
                              ['jumlah_obat_awal', 'jumlah_obat_diminum']]
            
            display_df = df[display_columns].copy()
            if 'jumlah_obat_saat_ini' in display_df.columns:
                display_df = display_df.rename(columns={'jumlah_obat_saat_ini': 'sisa_obat'})
            
            display_df = display_df.style.set_properties(**{
                'background-color': '#ffffff',
                'color': '#2b2e2d',
                'border': '1px solid rgba(233, 139, 31, 0.2)'
            })
            
            st.dataframe(display_df.sort_values(by="timestamp", ascending=False), use_container_width=True)
    else:
        st.markdown("""
            <div style="padding:30px; background:rgba(255, 165, 2, 0.1); border-radius:12px; text-align:center;">
                <p style="color:#ffa502; font-size:1.2rem; margin:0;">📊 Tidak ada data sensor yang tersedia</p>
            </div>
        """, unsafe_allow_html=True)

def generate_and_save_medicine_schedule(medical_history, box_cfg):
    """Generate and save medicine schedule automatically"""
    if not box_cfg or not medical_history:
        return None
    
    medication_name = box_cfg.get("medication_name", "")
    dosage_rules = box_cfg.get("dosage_rules", "")
    catatan_apoteker = box_cfg.get("catatan_apoteker", "")
    box_id = st.session_state.box_id
    
    if not medication_name or not dosage_rules or not box_id:
        return None
    
    if "reminder_collection" not in globals():
        global reminder_collection
        reminder_collection = db["MedicineReminders"]
    
    try:
        pharmacist_notes = ""
        if catatan_apoteker and catatan_apoteker.strip():
            pharmacist_notes = f"\nCatatan dari Apoteker: {catatan_apoteker}"
        
        prompt = f"""
        Sebagai ahli farmasi, analisis informasi berikut dan buat jadwal optimal:
        
        Riwayat medis: {medical_history}
        Nama obat: {medication_name}
        Aturan minum: {dosage_rules}{pharmacist_notes}
        
        Buat jadwal dalam format JSON dengan struktur berikut:
        {{
            "medicine_times": [
                {{"time": "08:00", "message": "Minum {medication_name} setelah sarapan"}},
                {{"time": "14:00", "message": "Minum {medication_name} setelah makan siang"}},
                {{"time": "20:00", "message": "Minum {medication_name} setelah makan malam"}}
            ],
            "meal_times": [
                {{"time": "07:30", "message": "Sarapan pagi"}},
                {{"time": "13:00", "message": "Makan siang"}},
                {{"time": "19:00", "message": "Makan malam"}}
            ],
            "explanation": "Penjelasan singkat tentang jadwal ini"
        }}
        
        Waktu harus dalam format 24 jam. Jadwal harus sesuai dengan aturan dosis dan kondisi medis pasien.
        """
        
        response = model.generate_content(prompt)
        
        import re
        import json
        
        try:
            schedule_data = json.loads(response.text)
        except:
            json_match = re.search(r'```json\s*(.*?)\s*```', response.text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    return None
                    
            try:
                schedule_data = json.loads(json_str)
            except:
                return None
        
        schedule_data["box_id"] = box_id
        schedule_data["updated_at"] = datetime.now(pytz.timezone("Asia/Jakarta"))
        schedule_data["is_active"] = True
        schedule_data["medical_history"] = medical_history
        
        result = reminder_collection.update_one(
            {"box_id": box_id},
            {"$set": schedule_data},
            upsert=True
        )
        
        updated_schedule = reminder_collection.find_one({"box_id": box_id})
        return updated_schedule
    
    except Exception as e:
        print(f"❌ Error saat memperbarui jadwal: {str(e)}")
        return None

def generate_and_save_medicine_schedule_from_config(medical_history, box_cfg):
    """Generate and save medicine schedule from configuration data"""
    if not box_cfg:
        return None
    
    medication_name = box_cfg.get("medication_name", "")
    dosage_rules = box_cfg.get("dosage_rules", "")
    condition = box_cfg.get("nama_penyakit", "")
    usia = box_cfg.get("usia", "")
    jenis_kelamin = box_cfg.get("jenis_kelamin", "")
    riwayat_alergi = box_cfg.get("riwayat_alergi", "")
    catatan_apoteker = box_cfg.get("catatan_apoteker", "")
    box_id = st.session_state.box_id
    
    if not medication_name or not dosage_rules or not box_id:
        return None
    
    if "reminder_collection" not in globals():
        global reminder_collection
        reminder_collection = db["MedicineReminders"]
    
    try:
        pharmacist_notes = ""
        if catatan_apoteker and catatan_apoteker.strip():
            pharmacist_notes = f"\nCatatan dari Apoteker: {catatan_apoteker}"
        
        prompt = f"""
        Sebagai ahli farmasi, buat jadwal pengingat obat berdasarkan informasi berikut:
        
        Nama obat: {medication_name}
        Aturan minum: {dosage_rules}
        Penyakit/Kondisi: {condition}
        Usia: {usia} tahun
        Jenis Kelamin: {jenis_kelamin}
        Riwayat Alergi: {riwayat_alergi}{pharmacist_notes}
        Informasi medis tambahan: {medical_history}
        
        Buat jadwal dalam format JSON dengan struktur berikut:
        {{
            "medicine_times": [...],
            "meal_times": [...],
            "explanation": "..."
        }}
        
        Hanya berikan output dalam format JSON tanpa kode atau penjelasan tambahan.
        """
        
        response = model.generate_content(prompt)
        
        import re
        import json
        
        try:
            schedule_data = json.loads(response.text)
        except:
            json_match = re.search(r'```json\s*(.*?)\s*```', response.text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    return create_fallback_schedule(medication_name)
                    
            try:
                schedule_data = json.loads(json_str)
            except:
                return create_fallback_schedule(medication_name)
        
        schedule_data["box_id"] = box_id
        schedule_data["updated_at"] = datetime.now(pytz.timezone("Asia/Jakarta"))
        schedule_data["is_active"] = True
        schedule_data["medical_history"] = medical_history
        
        result = reminder_collection.update_one(
            {"box_id": box_id},
            {"$set": schedule_data},
            upsert=True
        )
        
        updated_schedule = reminder_collection.find_one({"box_id": box_id})
        return updated_schedule
    
    except Exception as e:
        print(f"❌ Error saat memperbarui jadwal: {str(e)}")
        return create_fallback_schedule(medication_name)

def create_fallback_schedule(medication_name):
    """Create a simple fallback schedule if AI generation fails"""
    box_id = st.session_state.box_id
    
    fallback_data = {
        "medicine_times": [
            {"time": "08:00", "message": f"Minum {medication_name} setelah sarapan"},
            {"time": "12:00", "message": f"Minum {medication_name} setelah makan siang"},
            {"time": "20:00", "message": f"Minum {medication_name} setelah makan malam"}
        ],
        "meal_times": [
            {"time": "07:30", "message": "Sarapan pagi"},
            {"time": "11:30", "message": "Makan siang"},
            {"time": "19:00", "message": "Makan malam"}
        ],
        "explanation": "Jadwal pengingat standar untuk tiga kali minum obat sehari setelah makan.",
        "box_id": box_id,
        "updated_at": datetime.now(pytz.timezone("Asia/Jakarta")),
        "is_active": True,
        "medical_history": ""
    }
    
    if "reminder_collection" in globals():
        try:
            reminder_collection.update_one(
                {"box_id": box_id},
                {"$set": fallback_data},
                upsert=True
            )
        except Exception as e:
            print(f"❌ Error saat menyimpan jadwal fallback: {str(e)}")
    
    return fallback_data

# ===========================
# SIDEBAR NAVIGATION
# ===========================
if st.session_state.page not in ['login', 'config', 'confirm_config']:
    st.sidebar.markdown("""
        <div style="text-align:center; padding:20px 0;">
            <h2 style="color:#e98b1f; margin:0;">🔀 Menu</h2>
        </div>
    """, unsafe_allow_html=True)
    
    if st.session_state.box_id:
        menu = st.sidebar.radio("Pilih Halaman:", 
                              ["🩺 Pemeriksaan Kesehatan", "⏰ Pengingat Obat", "📚 Riwayat Sensor"],
                              label_visibility="collapsed")
    else:
        st.sidebar.info("Silakan login terlebih dahulu")
        menu = "🩺 Pemeriksaan Kesehatan"
else:
    menu = "🩺 Pemeriksaan Kesehatan"

# ===========================
# ROUTING
# ===========================
if st.session_state.page == 'login':
    display_header_with_logo()
    login_page()
elif st.session_state.page == 'confirm_config':
    display_header_with_logo()
    confirm_config_page()
elif st.session_state.page == 'config':
    display_header_with_logo()
    config_page()
else:
    if st.session_state.box_id:
        display_header_with_logo()
        
        if menu == "🩺 Pemeriksaan Kesehatan":
            if st.session_state.page == 'main':
                main_page()
            elif st.session_state.page == 'medical_history':
                medical_history_page()
            elif st.session_state.page == 'questioning':
                questioning_page()
            elif st.session_state.page == 'results':
                results_page()
            elif st.session_state.page == 'reminders':
                reminder_page()
        elif menu == "⏰ Pengingat Obat":
            reminder_page()
        elif menu == "📚 Riwayat Sensor":
            sensor_history_page()
    else:
        st.session_state.page = 'login'
        st.rerun()

# ===========================
# FOOTER
# ===========================
st.divider()
st.markdown("""
    <div style="text-align:center; padding:20px;">
        <p style="color:#e98b1f; font-style:italic; margin:0;">⚠️ Aplikasi ini bukan pengganti diagnosis medis profesional.</p>
        <p style="color:#999; font-size:0.9rem; margin-top:10px;">MediBox © 2025 - Smart Medicine Management System</p>
    </div>
""", unsafe_allow_html=True)