#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

#define SERVICE_UUID        "0000abcd-0000-1000-8000-00805f9b34fb"  // Unique service UUID
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"  // Characteristic UUID

BLECharacteristic *pCharacteristic;
bool deviceConnected = false;

// BLE Server Callbacks
class MyServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
        deviceConnected = true;
        Serial.println("Client connected");
    }

    void onDisconnect(BLEServer* pServer) {
        deviceConnected = false;
        Serial.println("Client disconnected");
    }
};

void setup() {
    // Start Serial communication
    Serial.begin(115200);
    Serial.println("ESP32 BLE Server");

    // Initialize BLE
    BLEDevice::init("TaskWearable");  // Set the device name
    BLEServer *pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    // Create a service
    BLEService *pService = pServer->createService(SERVICE_UUID);

    // Create a characteristic
    pCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
        BLECharacteristic::PROPERTY_NOTIFY
    );

    pCharacteristic->setValue("Hello from ESP32!");

    // Start the service
    pService->start();

    // Start advertising
    BLEAdvertising *pAdvertising = pServer->getAdvertising();
    pAdvertising->start();

    Serial.println("BLE server is running...");
}

void loop() {
    // Check if a client is connected and send notifications
    if (deviceConnected) {
        pCharacteristic->setValue("Data from ESP32: TaskWearable");
        pCharacteristic->notify();
        delay(1000);  // Send data every second
    }
    delay(500);
}
