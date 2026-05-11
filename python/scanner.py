import json
import socket
import time

import uvicorn
from dynaconf import Dynaconf
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from mosip_auth_sdk import MOSIPAuthenticator

config = Dynaconf(settings_files=["./config.toml"], environments=False)
authenticator = MOSIPAuthenticator(config=config)

app = FastAPI()

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
        otp_response = authenticator.genotp(
            individual_id=data["uin"],
            individual_id_type="UIN",
            email=True,
        )
        otp_response_body = otp_response.json()
        print(f"OTP: {otp_response_body}")

        global latest_scan
        latest_scan = {
            "uin": data["uin"],
            "transaction_id": otp_response_body["transactionID"],
            "otp_response": otp_response_body,
            "scanned_at": time.time(),
        }

        return data["uin"], otp_response_body

    except json.JSONDecodeError:
        print("Failed to parse JSON")
        return JSONResponse(status_code=400, content={"error": "Invalid JSON payload"})


@app.get("/api/scan-data")
async def get_scan_data():
    global latest_scan
    if latest_scan is None:
        return {"scan": None}
    if time.time() - latest_scan["scanned_at"] > 180:  # 3 minutes = 180 seconds
        latest_scan = None
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

        return authStatus

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
