import asyncio
from bleak import BleakClient, BleakScanner
import os
from git import Repo
from datetime import datetime

# === CONFIG ===
TARGET_NAME = "TaskWearable"
BLE_CHAR_UUID = "00002a19-0000-1000-8000-00805f9b34fb"
FILE_PATH = "E:/ManageMe/ble_recordings.txt"
REPO_PATH = "E:/ManageMe"

# === BLE HANDLER ===
def handle_ble_data(_, data: bytearray):
    text = data.decode('utf-8').strip()
    print(f"[BLE] Received: {text}")

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(FILE_PATH, "a") as f:
        f.write(f"[{timestamp}] {text}\n")

    try:
        repo = Repo(REPO_PATH)
        repo.git.add(FILE_PATH)
        repo.index.commit(f"Add BLE log: {timestamp}")
        origin = repo.remote(name="origin")
        origin.push()
        print(f"[GIT] Pushed update at {timestamp}")
    except Exception as e:
        print(f"[GIT ERROR] {e}")

# === BLE MAIN LOOP ===
async def run_ble():
    print("Scanning for BLE device...")
    devices = await BleakScanner.discover(timeout=5)
    target = next((d for d in devices if TARGET_NAME in d.name), None)

    if not target:
        print("Device not found.")
        return

    print(f"Connecting to {target.name} ({target.address})")
    async with BleakClient(target.address) as client:
        await client.start_notify(BLE_CHAR_UUID, handle_ble_data)
        print("Connected and listening. Press Ctrl+C to exit.")
        while True:
            await asyncio.sleep(1)

if __name__ == "__main__":
    try:
        asyncio.run(run_ble())
    except KeyboardInterrupt:
        print("Disconnected.")
