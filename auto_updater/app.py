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
    IST = ZoneInfo("Asia/Kolkata")
except ImportError:
    IST = timezone(timedelta(hours=5, minutes=30))

load_dotenv()

# --- Configuration ---
app = Flask(__name__)

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key) if (supabase_url and supabase_key) else None

# Global list to store logs for the web view
console_logs = []

def log_message(message):
    """Helper to print to console and save for web view."""
    now_ist = datetime.now(timezone.utc).astimezone(IST)
    timestamp = now_ist.strftime("%H:%M:%S IST")
    formatted_msg = f"[{timestamp}] {message}"
    print(formatted_msg)
    console_logs.append(formatted_msg)
    if len(console_logs) > 60:
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

TARGET_TIMES_SET = set(TARGET_TIMES)

# --- Web Server Routes ---
@app.route('/')
def home():
    now_ist = datetime.now(timezone.utc).astimezone(IST)
    header = f"<b>Learn Raj's Maths Auto Updater</b><br>Current Time: {now_ist.strftime('%Y-%m-%d %H:%M:%S IST')}<br><hr>"
    logs_view = "<br>".join(reversed(console_logs)) if console_logs else "Server running... Waiting for activity."
    return header + logs_view

# --- Background Logic ---
def generate_and_add_result(ist_now, utc_now, time_slot):
    if not supabase:
        log_message("Error: Supabase client not initialized. Check SUPABASE_URL and SUPABASE_KEY.")
        return False

    date_str = ist_now.strftime("%Y-%m-%d")

    # Check if slot already exists to prevent duplicate key errors
    try:
        check = supabase.table("results").select("id").eq("date", date_str).eq("time_slot", time_slot).execute()
        if check.data and len(check.data) > 0:
            log_message(f"Skipping: {date_str} {time_slot} already exists in database.")
            return True
    except Exception as e:
        log_message(f"Check duplicate warning: {e}")

    payload = {
        "date": date_str,
        "time_slot": time_slot,
        "display_time": ist_now.strftime("%I:%M %p"),
        "ra": f"RA{random.randint(0, 99):02d}",
        "rb": f"RB{random.randint(0, 99):02d}",
        "rc": f"RC{random.randint(0, 99):02d}",
        "rd": f"RD{random.randint(0, 99):02d}",
        "re": f"RE{random.randint(0, 99):02d}",
        "created_at": utc_now.isoformat()
    }

    for attempt in range(3):
        try:
            supabase.table("results").insert(payload).execute()
            log_message(f"Success: Inserted data for {time_slot} -> {payload['ra']}, {payload['rb']}, {payload['rc']}, {payload['rd']}, {payload['re']}")
            return True
        except Exception as e:
            log_message(f"Error: {e}. Retry {attempt + 1}/3...")
            time.sleep(3)
    return False

def background_worker():
    last_executed_minute = ""
    log_message("Background worker started. Monitoring 35 slots...")
    
    while True:
        try:
            now_utc = datetime.now(timezone.utc)
            now_ist = now_utc.astimezone(IST)
            current_time_str = now_ist.strftime("%H:%M")

            if current_time_str in TARGET_TIMES_SET and current_time_str != last_executed_minute:
                last_executed_minute = current_time_str
                log_message(f"Slot triggered: {current_time_str}. Waiting 20s for round draw...")
                time.sleep(20)
                
                # Fetch fresh timestamp after the wait
                fresh_utc = datetime.now(timezone.utc)
                fresh_ist = fresh_utc.astimezone(IST)
                generate_and_add_result(fresh_ist, fresh_utc, current_time_str)

        except Exception as e:
            log_message(f"Worker loop error: {e}")

        time.sleep(10)

# --- Start Worker on Module Load (Works with both Gunicorn & direct Python) ---
_worker_started = False
def start_worker():
    global _worker_started
    if not _worker_started:
        _worker_started = True
        threading.Thread(target=background_worker, daemon=True).start()

start_worker()

# --- Execution ---
if __name__ == "__main__":
    # Render binds dynamically to the PORT environment variable
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)