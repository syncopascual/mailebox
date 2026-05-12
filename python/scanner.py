import base64
import json
import os
import socket
import time

import requests
import uvicorn
from dynaconf import Dynaconf
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from mosip_auth_sdk import MOSIPAuthenticator

config = Dynaconf(settings_files=["./config.toml"], environments=False)
authenticator = MOSIPAuthenticator(config=config)

app = FastAPI()

latest_scan = None


def publish_command(cmd: str):
    """
    Publish a command to the ESP32 via EMQX HTTP API (MQTT over TLS).
    Reads EMQX credentials from environment variables.
    """
    emqx_url = os.getenv("EMQX_API_URL")
    app_id = os.getenv("EMQX_APP_ID")
    app_secret = os.getenv("EMQX_APP_SECRET")

    if not all([emqx_url, app_id, app_secret]):
        print("Warning: EMQX env vars missing, skipping MQTT publish")
        return

    auth_str = base64.b64encode(f"{app_id}:{app_secret}".encode()).decode()

    try:
        resp = requests.post(
            f"{emqx_url}/publish",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Basic {auth_str}",
            },
            json={"topic": "esp32/commands", "payload": cmd, "qos": 1},
            timeout=5,
        )
        resp.raise_for_status()
        print(f"Published to esp32/commands: {cmd}")
    except Exception as e:
        print(f"MQTT publish failed: {e}")


def clear_expired_scan():
    """Auto-clear scan after 3 minutes (180 seconds)."""
    global latest_scan
    if latest_scan and (time.time() - latest_scan["scanned_at"] > 180):
        print("Scan expired, clearing.")
        latest_scan = None


@app.post("/api/scan")
async def receive_scan(request: Request):
    print("\n--- New Scan Received ---")

    raw_bytes = await request.body()
    raw_string = raw_bytes.decode("utf-8")

    print(f"Raw string from ESP32: {raw_string}")

    try:
        data = json.loads(raw_string)
        print("Success! Parsed as JSON:")

        global latest_scan
        latest_scan = None  # Only 1 scan at a time
        clear_expired_scan()

        otp_response = authenticator.genotp(
            individual_id=data["uin"],
            individual_id_type="UIN",
            email=True,
        )
        otp_response_body = otp_response.json()
        print(f"OTP: {otp_response_body}")

        transaction_id = otp_response_body["transactionID"]

        latest_scan = {
            "uin": data["uin"],
            "mac": data.get("mac", "unknown"),
            "transaction_id": transaction_id,
            "otp_response": otp_response_body,
            "scanned_at": time.time(),
        }

        return JSONResponse(
            content={"status": "otp_sent", "transaction_id": transaction_id}
        )

    except json.JSONDecodeError:
        print("Failed to parse JSON")
        return JSONResponse(status_code=400, content={"error": "Invalid JSON payload"})
    except Exception as e:
        print(f"OTP generation failed: {e}")
        return JSONResponse(status_code=500, content={"error": "OTP generation failed"})


@app.get("/api/scan-data")
async def get_scan_data():
    clear_expired_scan()
    global latest_scan
    if latest_scan is None:
        return {"scan": None}
    return {"scan": latest_scan}


@app.post("/api/otp")
async def receive_otp(request: Request):
    raw_bytes = await request.body()
    raw_string = raw_bytes.decode("utf-8")
    try:
        data = json.loads(raw_string)
        print(f"Data: {data}")
        uin = data["uin"]
        otp = data["otp"]
        transaction_id = data["transaction_id"]

        response = authenticator.auth(
            individual_id=uin,
            individual_id_type="UIN",
            otp_value=otp,
            txn_id=transaction_id,
            consent=True,
        )
        response_body = response.json()
        print(f"RESPONSE: {response_body}")
        authStatus = response_body["response"]["authStatus"]

        global latest_scan
        if latest_scan and latest_scan["transaction_id"] == transaction_id:
            if authStatus:
                publish_command(json.dumps({"command": "success"}))
            else:
                publish_command(json.dumps({"command": "failure"}))
            latest_scan = None  # Delete immediately after publishing
        else:
            print("Warning: OTP result for unknown/expired transaction")

        return JSONResponse(content={"authStatus": authStatus})

    except json.JSONDecodeError:
        print("Failed to parse JSON")
        return JSONResponse(status_code=400, content={"error": "Invalid JSON payload"})


def get_local_ip():
    """Quick helper to find this computer's local IP address"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Doesn't even have to be reachable, just forces the OS to route
        s.connect(("10.254.254.254", 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


if __name__ == "__main__":
    local_ip = get_local_ip()
    print("\n" + "=" * 50)
    print(f"🚀 ESP32 SERVER URL: http://{local_ip}:8000/api/scan")
    print("=" * 50 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
