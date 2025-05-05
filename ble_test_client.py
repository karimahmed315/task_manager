import asyncio
from bleak import BleakClient, BleakScanner

SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b"  # Same as ESP32
CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8"

async def run():
    print("Scanning for devices...")
    devices = await BleakScanner.discover()
    for d in devices:
        print(f"Found: {d.name}, {d.address}")
        if "ManageMeESP32" in d.name:  # Match the BLE name you used
            address = d.address
            print(f"Connecting to {address}...")
            async with BleakClient(address) as client:
                print("Connected. Reading data...")
                
                def callback(sender, data):
                    print(f"Notification from {sender}: {data.decode('utf-8')}")
                
                await client.start_notify(CHAR_UUID, callback)
                await asyncio.sleep(10)  # Keep connection open for 10s
                await client.stop_notify(CHAR_UUID)
            return

    print("ESP32 not found. Is it powered and broadcasting?")

asyncio.run(run())
