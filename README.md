# ManageMe - Assistive Task Manager

ManageMe is an assistive technology project designed to help elderly individuals manage their daily tasks and schedules more effectively. The system aims to provide an accessible interface combining visual elements with voice interaction.

This repository contains the code for the final year individual project dissertation by Karim Abdou (karimahmed315).

## Current Status & Features (As of May 2025)

The project currently consists of two main parts: a functional screen device application and a prototyped wearable device.

**Screen Device (Functional):**

* **Platform:** Raspberry Pi 4 with official 7" Touchscreen.
* **Interface:** Web-based Graphical User Interface (GUI) served locally via Flask.
* **Frontend:** HTML, CSS, JavaScript providing an accessible UI with features like:
    * Task viewing (Today's tasks, Calendar view, Day view).
    * Task management (Add, Complete, Snooze, Delete - Soft & Permanent).
    * Recurring task definition (basic frequency, custom days, end date - *Note: Generation of future instances not fully implemented*).
    * Filtering (Upcoming tasks, Completed tasks).
    * Bulk actions (Delete all completed, Restore all deleted, etc.).
    * Customizable appearance (Font size, Color themes, Light/Dark/High Contrast modes).
    * On-screen keyboard integration (via Raspberry Pi OS configuration).
    * Kiosk mode operation (boots directly into the app).
* **Backend:** Python (Flask) handling API requests and data management.
* **Data Storage:** Uses local dictionaries in `app.py` for **volatile** storage (data is lost on server restart). *Designed for future SQLite integration.*
* **Speech-to-Text (STT):** Implemented using the browser's **Web Speech API** for voice input directly on the screen device (requires internet connection).

**Wearable Device (Breadboard Prototype):**

* **Platform:** ESP32-DevKitC V4 connected to components on a breadboard.
* **Components:** Includes MEMS I2S Microphone (INMP441), Haptic Motor Driver (DRV2605L), tactile buttons, LiPo battery, and power management modules (TP4056, MT3608).
* **Functionality Demonstrated:**
    * Firmware developed using Arduino Core for ESP32.
    * Haptic feedback control via I2C (using DRV2605 library).
    * Button input handling with debouncing.
    * Basic Finite State Machine (FSM) for managing modes.
    * I2S audio capture concept demonstrated.
    * BLE Peripheral setup (advertising, basic service/characteristic definition).
    * BLE communication for receiving alert commands from the screen device validated.
* **Incomplete/Future Work:**
    * Assembly onto stripboard/PCB.
    * Enclosure design/fabrication.
    * Full integration of BLE audio streaming pipeline with a backend STT engine.

**Overall Project Status:**

* The **Screen Device** functions as a standalone task manager with browser-based voice input.
* The **Wearable Device** is a functional hardware/firmware prototype demonstrating key concepts but not fully integrated or assembled into a final form factor.
* **Offline STT** (e.g., Vosk integration) and **Enclosure Fabrication** are planned future work.

## Technology Stack

* **Screen Device Backend:** Python 3, Flask
* **Screen Device Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **Screen Device STT:** Web Speech API (Browser-based)
* **Wearable Firmware:** C++ (Arduino Core for ESP32)
* **Communication Protocol:** Bluetooth Low Energy (BLE) - using Bleak (Python) and ESP32 BLE Arduino library.
* **Libraries/Frameworks:** Font Awesome (Icons), dateutil (Python - planned for backend parsing), potentially others defined in code.

## Setup and Running (Screen Device)

These instructions assume setup on a Raspberry Pi 4 with Raspberry Pi OS (or a similar Linux environment) and a connected USB microphone.

1.  **Clone Repository:**
    ```bash
    git clone [https://github.com/karimahmed315/task_manager.git](https://github.com/karimahmed315/task_manager.git)
    cd task_manager
    ```
2.  **Install Dependencies:**
    * Ensure Python 3 and `pip` are installed.
    * Install Flask:
        ```bash
        pip install Flask python-dateutil # dateutil used in backend parsing logic
        ```
    * *Optional (for BLE scripts):* Install Bleak and GitPython:
        ```bash
        pip install bleak GitPython
        ```
3.  **Run the Flask Server:**
    ```bash
    python app.py
    ```
    The server will start, typically accessible at `http://[Your-Pi-IP-Address]:5000` or `http://localhost:5000` if running locally (can also be run on index.html).
4.  **Access the Interface:**
    * Open a web browser (like Chromium on the Pi) and navigate to the address where the Flask app is running.
    * For STT functionality using the Web Speech API, ensure you are using a compatible browser (like Chrome/Edge) and have an active internet connection. Grant microphone permissions when prompted.
5.  **Kiosk Mode (Optional):**
    * Refer to Raspberry Pi documentation for setting up kiosk mode to automatically launch the browser fullscreen on boot, pointing to `http://localhost:5000`. This involves editing autostart files (e.g., `~/.config/lxsession/LXDE-pi/autostart`).

## Wearable Prototype Status

* The code for the ESP32 firmware is intended for the Arduino IDE with the ESP32 Core installed.
* It requires libraries for BLE and the DRV2605 (e.g., Adafruit DRV2605 library).
* The hardware setup corresponds to the breadboard prototype described in the dissertation.
* Full functionality requires pairing with a BLE Central application (like the one intended to run alongside the Flask app, or using test scripts like `ble_test_client.py`).

## Other Scripts

* **`main.py`:** A legacy Tkinter-based GUI application developed earlier. Not the primary interface used in the final project evaluation.
* **`ble_test_client.py`:** A basic Python script using Bleak to scan for and connect to the ESP32 wearable prototype to test BLE notifications.
* **`ble_receiver_push.py`:** An example Python script demonstrating receiving BLE data, writing it to a file, and pushing the changes to a Git repository. Useful for logging data from the wearable during development.
