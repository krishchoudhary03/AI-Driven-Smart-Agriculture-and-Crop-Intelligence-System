import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // NOTE: This assumes the Next.js app is running on the SAME local network as the Arduino.
    // Replace this IP address with the actual IP address printed in your Arduino Serial Monitor
    const arduinoIP = process.env.ARDUINO_IP || '192.168.1.100'; 
    const arduinoUrl = `http://${arduinoIP}/`;

    // Add a small timeout so the API doesn't hang forever if the Arduino is offline
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(arduinoUrl, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Arduino responded with status: ${response.status}`);
    }

    const data = await response.json();

    // The data should look like: { "temperature": 25.5, "humidity": 60.0 }
    return NextResponse.json({
      success: true,
      data: {
        temperature: data.temperature,
        humidity: data.humidity,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error fetching sensor data:', error);
    
    // Provide fallback/simulated data if the sensor is unreachable 
    // This is useful for development or when the hardware isn't plugged in yet
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to communicate with Arduino DHT11 Sensor',
      fallbackData: {
        temperature: 24.5,
        humidity: 62.0,
        timestamp: new Date().toISOString(),
        isSimulated: true
      }
    }, { status: 503 }); // 503 Service Unavailable
  }
}
