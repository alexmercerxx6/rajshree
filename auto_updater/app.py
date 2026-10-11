import os
import random
import time
import threading
from datetime import datetime, timezone, timedelta
from flask import Flask
from supabase import create_client, Client
from dotenv import load_dotenv

# Timezone Handling
try:
    from zoneinfo import ZoneInfo
except ImportError:
    ZoneInfo = None

load_dotenv()

# --- Configuration ---
app = Flask(__name__)
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_KEY"))

# Global list to store logs for the web view
console_logs = []

def log_message(message):
    """Helper to print to console and save for web view."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    formatted_msg = f"[{timestamp}] {message}"
    print(formatted_msg)
    console_logs.append(formatted_msg)
    # Keep only the last 50 logs to save memory
    if len(console_logs) > 50:
        console_logs.pop(0)

TARGET_TIMES = [
    "10:40", 
    "11:00", "11:20", "11:40",
    "12:00", "12:20", "12:40", 
    "13:00", "13:20", "13:40",
    "14:00", "14:20", "14:40",
    "15:00", "15:15", "15:30", "15:45",
    "16:00", "16:15", "16:30", "16:45",
    "17:00", "17:15", "17:30", "17:45",
    "18:00", "18:20", "18:40",
    "19:00", "19:20", "19:40",
    "20:00", "20:20", "20:40",
    "21:00"
]

# --- Web Server Routes ---
@app.route('/')
def home():
    # Joins all logs with a line break for the browser
    return "<br>".join(console_logs) if console_logs else "Server running... Waiting for first log."

# --- Background Logic ---
def generate_and_add_result(ist_now, utc_now):
    payload = {
        "date": ist_now.strftime("%Y-%m-%d"),
        "time_slot": ist_now.strftime("%H:%M"),
        "display_time": ist_now.strftime("%I:%M %p").replace("AM", "A.M").replace("PM", "P.M"),
        "ra": str(random.randint(0, 99)).zfill(2),
        "rb": str(random.randint(0, 99)).zfill(2),
        "rc": str(random.randint(0, 99)).zfill(2),
        "rd": str(random.randint(0, 99)).zfill(2),
        "re": str(random.randint(0, 99)).zfill(2),
        "created_at": utc_now.isoformat()
    }
    for attempt in range(3):
        try:
            supabase.table("results").insert(payload).execute()
            log_message(f"Success: Inserted data for {payload['time_slot']}")
            return True
        except Exception as e:
            log_message(f"Error: {e}. Retry {attempt + 1}/3...")
            time.sleep(3)

def background_worker():
    last_executed_minute = ""
    log_message("Background worker started...")
    
    while True:
        now_utc = datetime.now(timezone.utc)
        now_ist = now_utc.astimezone(ZoneInfo("Asia/Kolkata")) if ZoneInfo else now_utc + timedelta(hours=5, minutes=30)
        current_time_str = now_ist.strftime("%H:%M")

        if current_time_str in TARGET_TIMES and current_time_str != last_executed_minute:
            log_message(f"Generating data for slot: {current_time_str}")
            time.sleep(30)
            generate_and_add_result(now_ist, now_utc)
            last_executed_minute = current_time_str
        
        time.sleep(10)

# --- Execution ---
if __name__ == "__main__":
    # 1. Start the background loop in a separate thread
    threading.Thread(target=background_worker, daemon=True).start()
    
    # 2. Start the Flask web server
    # Render provides the PORT env variable automatically
    app.run(host='0.0.0.0', port=8080)