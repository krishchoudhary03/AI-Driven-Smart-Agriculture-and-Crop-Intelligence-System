# DHT11 Hardware Integration Guide (Arduino Uno R4 WiFi)

This guide walks you through integrating the physical DHT11 sensor with your Arduino Uno R4 WiFi and fetching the actual data from your Next.js application.

## 1. Hardware Setup (Arduino)
1. **Connect the DHT11:**
   - **VCC** (or +) -> Arduino **5V**
   - **GND** (or -) -> Arduino **GND**
   - **DATA** (or Out) -> Arduino **Digital Pin 2**
   *(Note: If your sensor doesn't have a built-in resistor, place a 10k resistor between VCC and DATA).*

2. **Upload the Sketch:**
   - Open the Arduino IDE.
   - Install the **DHT sensor library** by Adafruit (and the Adafruit Unified Sensor library).
   - Open the `arduino-sketches/dht11_server/dht11_server.ino` file provided in this workspace.
   - Update `YOUR_WIFI_SSID` and `YOUR_WIFI_PASSWORD` with your local Wi-Fi credentials.
   - Upload the sketch to your Arduino Uno R4 WiFi.
   - Open the **Serial Monitor (9600 baud)**. Once connected to Wi-Fi, it will print an IP address (e.g., `192.168.1.100`). **Copy this IP address**.

## 2. Next.js API Setup
We've created a Next.js API route located at `app/api/sensor-data/route.ts`. 

1. **Set the Arduino IP:**
   - Open your `.env.local` file (create it if it doesn't exist) and add the IP address from the Serial Monitor:
     ```env
     ARDUINO_IP=192.168.1.100
     ```
   - *Alternatively, update the fallback IP directly in `route.ts`.*

## 3. Frontend Integration ("Automatically Fetch Reading")
When the farmer submits the form with their details, you can automatically fetch the sensor readings before finally saving the data. Here is how you can write that logic in your form's submission handler:

```javascript
// Example usage inside your React Component
const handleFarmerSubmit = async (farmerDetails) => {
  try {
    // 1. Fetch live sensor reading from Arduino
    const sensorRes = await fetch('/api/sensor-data');
    const sensorData = await sensorRes.json();
    
    let finalDataToSave = { ...farmerDetails };

    if (sensorData.success) {
      console.log("Successfully fetched LIVE Arduino Data:", sensorData.data);
      // Append real data
      finalDataToSave.temperature = sensorData.data.temperature;
      finalDataToSave.humidity = sensorData.data.humidity;
    } else {
      console.warn("Using simulated data. Hardware might be offline.", sensorData.fallbackData);
      // Use fallback if hardware disconnected
      finalDataToSave.temperature = sensorData.fallbackData.temperature;
      finalDataToSave.humidity = sensorData.fallbackData.humidity;
    }

    // 2. Proceed to send finalDataToSave to your ML model or Database
    // await fetch('/api/predict', { method: 'POST', body: JSON.stringify(finalDataToSave) });

  } catch (err) {
    console.error("Error during submission flow:", err);
  }
};
```

### How it works
1. **The Arduino** runs a lightweight web server on your local Wi-Fi network.
2. **The Next.js App** (running on the same Wi-Fi network) queries the Arduino's IP address.
3. **The User Flow:** The farmer clicks "Submit", the frontend silently queries `/api/sensor-data`, grabs the exact temperature & humidity at that second, merges it with the farmer's form details, and sends it to the backend/database.
