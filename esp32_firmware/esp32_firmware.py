from machine import Pin, ADC, PWM, SoftI2C
import ssd1306
import dht
import time
import network
import ntptime
import urequests as requests
import json

# ========= Hardware Configuration ========= #
led_pins = [2, 4, 5, 18]
leds = [Pin(pin, Pin.OUT) for pin in led_pins]

ldr = ADC(Pin(34))
ldr.atten(ADC.ATTN_11DB)
LDR_THRESHOLD = 1000

dht_sensor = dht.DHT11(Pin(13))

buzzer = PWM(Pin(23), freq=1000, duty=0)

button_yes = Pin(25, Pin.IN, Pin.PULL_UP)
button_no = Pin(26, Pin.IN, Pin.PULL_UP)

i2c = SoftI2C(scl=Pin(22), sda=Pin(21))
oled = ssd1306.SSD1306_I2C(128, 64, i2c)

# ========= WiFi and Server Configuration ========= #
WIFI_SSID = "Redmi Note 9"
WIFI_PASSWORD = "Brama123"
PRIMARY_SERVER = "http://192.168.43.229:8080"
BACKUP_SERVER = "http://192.168.43.229:8080"
SERVER_URL = PRIMARY_SERVER
BOX_ID = "protobox"

wifi_client = network.WLAN(network.STA_IF)

# ========= Status Variables ========= #
obat_diminum = [False] * 5
kotak_terbuka = False
kotak_last_state = False
jumlah_obat_diminum = 0

# ========= Reminder Variables ========= #
last_reminder_check = 0
reminder_check_interval = 30000
last_server_check = 0
server_check_interval = 3600000

current_reminder = None
reminder_active = False
reminder_start_time = 0
reminder_display_duration = 20000
reminder_acknowledged = False

display_mode = "clock"
last_display_update = 0
display_update_interval = 1000

ntp_synced = False
last_sync_time = 0
sync_interval = 3600
timezone_offset = 7 * 3600

buzzer_active = False
buzzer_start_time = 0
buzzer_duration = 0

reminder_blink = False
reminder_blink_time = 0
reminder_blink_interval = 500

last_sensor_update = 0
sensor_update_interval = 10000

debug_counter = 0

# ========= Functions ========= #
def connect_wifi():
    wifi_client.active(True)
    if wifi_client.isconnected():
        print("✅ Already connected to WiFi")
        return True
    print(f"🔄 Connecting to WiFi {WIFI_SSID}...")
    tampilkan_oled("Connecting to WiFi", WIFI_SSID, "Please wait...", "")
    try:
        wifi_client.connect(WIFI_SSID, WIFI_PASSWORD)
        timeout = 15
        while not wifi_client.isconnected() and timeout > 0:
            print(f"Waiting for connection... {timeout}s")
            tampilkan_oled("Connecting to WiFi", WIFI_SSID, f"Timeout: {timeout}s", "")
            time.sleep(1)
            timeout -= 1
        if wifi_client.isconnected():
            ip = wifi_client.ifconfig()[0]
            print(f"✅ WiFi Connected! IP: {ip}")
            tampilkan_oled("WiFi Connected", f"IP: {ip}", "", "")
            time.sleep(1)
            return True
        else:
            print("❌ WiFi connection timeout")
            tampilkan_oled("WiFi Error", "Connection", "timeout", "")
            time.sleep(2)
            return False
    except Exception as e:
        print(f"❌ WiFi connection error: {e}")
        tampilkan_oled("WiFi Error", str(e)[:16], "", "")
        time.sleep(2)
        return False

def switch_server():
    global SERVER_URL
    if SERVER_URL == PRIMARY_SERVER:
        SERVER_URL = BACKUP_SERVER
        print(f"⚠ Switching to backup server: {SERVER_URL}")
    else:
        SERVER_URL = PRIMARY_SERVER
        print(f"⚠ Switching back to primary server: {SERVER_URL}")

def check_server_health():
    global last_server_check
    now = time.ticks_ms()
    if time.ticks_diff(now, last_server_check) < server_check_interval:
        return
    last_server_check = now
    if not wifi_client.isconnected():
        connect_wifi()
        return
    try:
        url = f"{SERVER_URL}/send_data"
        print(f"🔍 Checking server health: {url}")
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print("✅ Server is functioning properly")
        else:
            print(f"⚠ Server responded with status code: {response.status_code}")
        response.close()
    except Exception as e:
        print(f"❌ Server is not accessible: {e}")
        switch_server()

def baca_dht():
    try:
        dht_sensor.measure()
        temperature = dht_sensor.temperature()
        humidity = dht_sensor.humidity()
        return temperature, humidity
    except Exception as e:
        print("DHT Error:", e)
        return None, None

def deteksi_kotak_terbuka():
    return ldr.read() > LDR_THRESHOLD

def tampilkan_oled(line1, line2="", line3="", line4=""):
    oled.fill(0)
    if line1:
        oled.text(line1, 0, 0)
    if line2:
        oled.text(line2, 0, 16)
    if line3:
        oled.text(line3, 0, 32)
    if line4:
        oled.text(line4, 0, 48)
    oled.show()

def aktifkan_buzzer(duration_ms=500, intensity=512):
    global buzzer_start_time, buzzer_duration, buzzer_active
    buzzer.duty(intensity)
    buzzer_start_time = time.ticks_ms()
    buzzer_duration = duration_ms
    buzzer_active = True

def get_current_time():
    global ntp_synced, last_sync_time
    try:
        current_time = time.time()
        if not ntp_synced or (current_time - last_sync_time) > sync_interval:
            if wifi_client.isconnected():
                try:
                    ntptime.settime()
                    ntp_synced = True
                    last_sync_time = time.time()
                    print("✓ Time synchronized with NTP")
                except Exception as e:
                    print(f"✗ Failed NTP sync: {e}")
                    if not ntp_synced:
                        return "00:00"
            else:
                if not ntp_synced:
                    return "00:00"
        current_time = time.time() + timezone_offset
        local_time = time.localtime(current_time)
        time_string = "{:02d}:{:02d}".format(local_time[3], local_time[4])
        return time_string
    except Exception as e:
        print(f"✗ Error in get_current_time: {e}")
        return "00:00"

def get_current_date():
    try:
        if not ntp_synced:
            return "00/00/0000"
        current_time = time.time() + timezone_offset
        local_time = time.localtime(current_time)
        date_string = "{:02d}/{:02d}/{:04d}".format(
            local_time[2], local_time[1], local_time[0]
        )
        return date_string
    except Exception as e:
        print(f"✗ Error in get_current_date: {e}")
        return "00/00/0000"

def is_time_match(current_time, scheduled_time):
    sched_time_str = ""
    if isinstance(scheduled_time, dict) and "time" in scheduled_time:
        sched_time_str = scheduled_time["time"]
    elif isinstance(scheduled_time, str):
        sched_time_str = scheduled_time
    else:
        print(f"❌ Unknown time format: {scheduled_time}")
        return False
    if "." in sched_time_str:
        sched_time_str = sched_time_str.replace(".", ":")
    if ":" not in sched_time_str:
        print(f"❌ Invalid time format: {sched_time_str}")
        return False
    try:
        hour_sched, min_sched = map(int, sched_time_str.split(':'))
        hour_curr, min_curr = map(int, current_time.split(':'))
        print(f"  Time comparison: scheduled {hour_sched}:{min_sched} vs current {hour_curr}:{min_curr}")
    except ValueError:
        print(f"❌ Failed to parse time: {sched_time_str} or {current_time}")
        return False
    sched_minutes = hour_sched * 60 + min_sched
    curr_minutes = hour_curr * 60 + min_curr
    tolerance = 5
    match = abs(sched_minutes - curr_minutes) <= tolerance
    if match:
        print(f"✓ Time match: {current_time} with {sched_time_str} (within {tolerance} minute tolerance)")
    else:
        diff = abs(sched_minutes - curr_minutes)
        print(f"✗ No time match: {current_time} with {sched_time_str} (diff: {diff} minutes)")
    return match

def update_reminder_display():
    global current_reminder, reminder_blink
    if not current_reminder:
        return
    reminder_type = current_reminder.get("type", "")
    time_str = current_reminder.get("time", "")
    if reminder_type == "medicine":
        message = "SAATNYA MINUM OBAT"
        icon = "!!"
    else:
        message = "SAATNYA MAKAN"
        icon = ">>"
    print(f"✅ FORCING DISPLAY UPDATE: {message}")
    tampilkan_oled(
        f"{icon} PENGINGAT {icon}",
        message,
        f"Pukul: {time_str}",
        "Tekan tombol OK"
    )

def cek_button_yes():
    debounce_time = 300
    if not button_yes.value():
        start = time.ticks_ms()
        while not button_yes.value():
            if time.ticks_diff(time.ticks_ms(), start) > debounce_time:
                return True
    return False

def cek_button_no():
    debounce_time = 300
    if not button_no.value():
        start = time.ticks_ms()
        while not button_no.value():
            if time.ticks_diff(time.ticks_ms(), start) > debounce_time:
                return True
    return False

def cek_reminder():
    global last_reminder_check, current_reminder, reminder_active
    global reminder_start_time, reminder_acknowledged, display_mode
    now = time.ticks_ms()
    if time.ticks_diff(now, last_reminder_check) < reminder_check_interval:
        return
    last_reminder_check = now
    if reminder_active:
        return
    print("\n🔍 Checking reminders...")
    if not wifi_client.isconnected():
        print("⚠ WiFi disconnected, trying to reconnect...")
        if not connect_wifi():
            print("❌ Failed to reconnect WiFi")
            tampilkan_oled("Error", "WiFi disconnected", "Please check", "connection")
            return
    try:
        current_time = get_current_time()
        print(f"⏰ Current time: {current_time}")
        url = f"{SERVER_URL}/get_minimal_reminders/{BOX_ID}"
        print(f"📡 Accessing: {url}")
        max_retries = 3
        retry_count = 0
        while retry_count < max_retries:
            try:
                response = requests.get(url, timeout=10)
                data = response.json()
                response.close()
                print(f"📥 Data received: {json.dumps(data)}")
                break
            except Exception as e:
                retry_count += 1
                if retry_count < max_retries:
                    print(f"⚠ Connection failed (attempt {retry_count}/{max_retries}): {e}")
                    tampilkan_oled(
                        "Retrying...",
                        f"Attempt {retry_count}/{max_retries}",
                        f"Error: {str(e)[:16]}"
                    )
                    time.sleep(2)
                else:
                    print(f"❌ Failed after {max_retries} attempts: {e}")
                    tampilkan_oled(
                        "Connection Error",
                        "Failed to check",
                        "reminders",
                        "Will retry later"
                    )
                    return
        if data.get("has_reminder", False):
            print("✅ Server mengembalikan has_reminder: True")
            print(f"Medicine times: {len(data.get('medicine_times', []))}, Meal times: {len(data.get('meal_times', []))}")
            active_reminder = None
            reminder_type = None
            for idx, med_time in enumerate(data.get("medicine_times", [])):
                time_str = med_time.get("time", "00:00")
                print(f"  Checking medicine time #{idx+1}: {time_str} vs current: {current_time}")
                if is_time_match(current_time, time_str):
                    print(f"  ✅ MATCH FOUND for medicine time: {time_str}")
                    active_reminder = med_time
                    reminder_type = "medicine"
                    break
                else:
                    print(f"  ❌ No match for medicine time: {time_str}")
            if active_reminder is None:
                for idx, meal_time in enumerate(data.get("meal_times", [])):
                    time_str = meal_time.get("time", "00:00")
                    print(f"  Checking meal time #{idx+1}: {time_str} vs current: {current_time}")
                    if is_time_match(current_time, time_str):
                        print(f"  ✅ MATCH FOUND for meal time: {time_str}")
                        active_reminder = meal_time
                        reminder_type = "meal"
                        break
                    else:
                        print(f"  ❌ No match for meal time: {time_str}")
            if active_reminder:
                reminder_message = active_reminder.get("message", "")
                reminder_time = active_reminder.get("time", "")
                print(f"⏰ Active reminder found: {reminder_type} - {reminder_message} ({reminder_time})")
                current_reminder = {
                    "type": reminder_type,
                    "message": reminder_message,
                    "time": reminder_time
                }
                reminder_active = True
                reminder_start_time = now
                reminder_acknowledged = False
                display_mode = "reminder"
                print(f"✅ DISPLAY MODE CHANGED TO: {display_mode}")
                if reminder_type == "medicine":
                    aktifkan_buzzer(2000, 768)
                else:
                    aktifkan_buzzer(1000, 512)
                update_reminder_display()
                try:
                    ack_data = {"reminder_id": data.get("_id")}
                    ack_url = f"{SERVER_URL}/acknowledge_reminder"
                    print(f"📤 Sending acknowledgment: {json.dumps(ack_data)}")
                    ack_response = requests.post(
                        ack_url,
                        json=ack_data,
                        headers={'Content-Type': 'application/json'}
                    )
                    if ack_response.status_code == 200:
                        print("✓ Acknowledgment sent successfully")
                        reminder_acknowledged = True
                    else:
                        print(f"✗ Failed to send acknowledgment: {ack_response.status_code}")
                    ack_response.close()
                except Exception as e:
                    print(f"✗ Error sending acknowledgment: {e}")
            else:
                print("📅 No schedule matches the current time")
        else:
            print("📅 No active schedule for this box")
    except ValueError as e:
        print(f"❌ Error parsing JSON response: {e}")
        tampilkan_oled("Error", "Invalid data", "from server", "Check logs")
    except Exception as e:
        print(f"❌ Failed to check reminder: {e}")
        tampilkan_oled("Error", str(e)[:16], "checking reminder", "")

def update_display():
    global display_mode, last_display_update, reminder_blink, reminder_blink_time, debug_counter
    now = time.ticks_ms()
    if time.ticks_diff(now, last_display_update) < display_update_interval:
        return
    last_display_update = now
    debug_counter += 1
    if display_mode == "reminder":
        if time.ticks_diff(now, reminder_blink_time) >= reminder_blink_interval:
            reminder_blink = not reminder_blink
            reminder_blink_time = now
    if display_mode == "clock":
        current_time = get_current_time()
        current_date = get_current_date()
        tampilkan_oled(
            f"Time: {current_time}",
            f"Date: {current_date}",
            f"Status: {wifi_client.isconnected() and 'Online' or 'Offline'}",
            f"MediBox {BOX_ID}"
        )
    elif display_mode == "reminder":
        if current_reminder:
            reminder_type = current_reminder.get("type", "")
            time_str = current_reminder.get("time", "")
            if reminder_type == "medicine":
                message = "SAATNYA MINUM OBAT"
                icon = "!!" if reminder_blink else "  "
            else:
                message = "SAATNYA MAKAN"
                icon = ">>" if reminder_blink else "  "
            tampilkan_oled(
                f"{icon} PENGINGAT {icon}",
                message,
                f"Pukul: {time_str}",
                "Tekan tombol OK"
            )
        else:
            tampilkan_oled(
                "! REMINDER ERROR !",
                "No active reminder",
                "But in reminder mode",
                "Debug required"
            )
    elif display_mode == "box":
        temperature, humidity = baca_dht()
        ldr_value = ldr.read()
        temperature_str = f"Temp: {temperature}°C" if temperature is not None else "Temp: Error"
        humidity_str = f"Humidity: {humidity}%" if humidity is not None else "Humidity: Error"
        kotak_status = "TERBUKA 📂" if kotak_terbuka else "TERTUTUP 📁"
        tampilkan_oled(
            temperature_str,
            humidity_str,
            f"LDR: {ldr_value}",
            f"Box: {kotak_status}"
        )
    elif display_mode == "status":
        tampilkan_oled(
            "System Status:",
            f"WiFi: {wifi_client.isconnected() and 'OK' or 'Disconnected'}",
            f"NTP: {ntp_synced and 'Synced' or 'Not Synced'}",
            f"Pills taken: {jumlah_obat_diminum}"
        )

def kirim_data_ke_server():
    global last_sensor_update
    now = time.ticks_ms()
    if time.ticks_diff(now, last_sensor_update) < sensor_update_interval:
        return
    last_sensor_update = now
    if not wifi_client.isconnected():
        print("⚠ WiFi disconnected, trying to reconnect...")
        if not connect_wifi():
            return
    try:
        temperature, humidity = baca_dht()
        ldr_value = ldr.read()
        if temperature is None or humidity is None:
            print("⚠ DHT sensor not ready")
            return
        data = {
            "temperature": temperature,
            "humidity": humidity,
            "ldr_value": ldr_value,
            "box_id": BOX_ID,
            "medicine_taken": jumlah_obat_diminum > 0
        }
        url = f"{SERVER_URL}/send_data"
        headers = {'Content-Type': 'application/json'}
        print(f"📤 Sending data: {json.dumps(data)}")
        response = requests.post(url, json=data, headers=headers)
        print(f"📤 Data sent! Response: {response.status_code}")
        if response.status_code == 200 and jumlah_obat_diminum > 0:
            global obat_diminum
            obat_diminum = [False] * 5
        response.close()
    except Exception as e:
        print(f"❌ Failed to send data: {e}")

def check_box_status():
    global kotak_terbuka, kotak_last_state, jumlah_obat_diminum, display_mode
    current_box_state = deteksi_kotak_terbuka()
    if current_box_state != kotak_last_state:
        if current_box_state:
            print("Box Opened")
            for i in range(len(leds)):
                if not obat_diminum[i]:
                    leds[i].value(1)
            aktifkan_buzzer(300)
            display_mode = "box"
        else:
            print("Box Closed")
            for led in leds:
                led.value(0)
            tampilkan_oled("Have you", "taken your medicine?", "Yes: Left button", "No: Right button")
            timeout = time.ticks_ms() + 10000
            while time.ticks_ms() < timeout:
                if cek_button_yes():
                    print("Medicine confirmed taken")
                    for i in range(len(obat_diminum)):
                        if not obat_diminum[i]:
                            obat_diminum[i] = True
                            jumlah_obat_diminum += 1
                            break
                    print(f"jumlah_obat_diminum: {jumlah_obat_diminum}")
                    tampilkan_oled("Thank you!")
                    aktifkan_buzzer(200)
                    time.sleep(1)
                    break
                elif cek_button_no():
                    print("Medicine not taken")
                    tampilkan_oled("Don't forget", "to take it!")
                    aktifkan_buzzer(500)
                    time.sleep(1)
                    break
            display_mode = "clock"
    kotak_last_state = current_box_state

def loop():
    global reminder_active, display_mode, buzzer_active
    connect_wifi()
    tampilkan_oled("MediBox", f"ID: {BOX_ID}", "Starting...", "")
    global reminder_blink_time
    reminder_blink_time = time.ticks_ms()
    while True:
        now = time.ticks_ms()
        if buzzer_active:
            if time.ticks_diff(now, buzzer_start_time) >= buzzer_duration:
                buzzer.duty(0)
                buzzer_active = False
        check_box_status()
        kirim_data_ke_server()
        check_server_health()
        if not reminder_active:
            cek_reminder()
        else:
            if time.ticks_diff(now, reminder_start_time) >= reminder_display_duration:
                print("⏰ Reminder display duration finished")
                reminder_active = False
                display_mode = "clock"
        if reminder_active and cek_button_yes():
            print("✅ Reminder acknowledged by user")
            reminder_active = False
            display_mode = "clock"
            aktifkan_buzzer(100)
        update_display()
        time.sleep(0.1)

try:
    tampilkan_oled(
        "MediBox v1.0",
        "Starting system...",
        "Please wait...",
        ""
    )
    time.sleep(2)
    print("\n🔷 MediBox Starting")
    print(f"🔷 Box ID: {BOX_ID}")
    loop()
except KeyboardInterrupt:
    print("Program terminated by user")
except Exception as e:
    print(f"Unexpected error: {e}")
    tampilkan_oled(
        "ERROR!",
        str(e)[:16],
        str(e)[16:32] if len(str(e)) > 16 else "",
        "Restart required"
    )