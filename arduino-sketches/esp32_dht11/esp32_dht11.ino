#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <DHT.h>

// ========== WIFI ==========
const char* ssid = "testwifi";
const char* password = "87654321";

// ========== SUPABASE ==========
const char* host = "potmhgdttfhmsqxfevgj.supabase.co";
const char* apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvdG1oZ2R0dGZobXNxeGZldmdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NTA3NzcsImV4cCI6MjA4ODAyNjc3N30.A1z5mIcvi3O-A8vFaj5tpCCWrjRhUFLI6bsBXoQxn-o"; // 🔥 paste your key

// ========== FARMER ==========
String farmer_id = "419961d3-ff88-4f55-a605-7fa5126c08d0";

// ========== DHT ==========
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

WiFiClientSecure client;

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
    Serial.print('.');
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
  } else {
    Serial.println("\nWiFi connection failed");
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);
  dht.begin();
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) {
      delay(10000);
      return;
    }
  }

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Sensor error!");
    delay(10000);
    return;
  }

  Serial.println("Sending to Supabase...");

  client.setInsecure();  // skip SSL verification (use with caution)

  if (client.connect(host, 443)) {
    Serial.println("Connected to Supabase!");

    String json = "{";
    json += "\"farmer_id\":\"" + farmer_id + "\",";
    json += "\"temperature\":" + String(temperature) + ",";
    json += "\"humidity\":" + String(humidity);
    json += "}";

    client.println("POST /rest/v1/sensor_data HTTP/1.1");
    client.print("Host: ");
    client.println(host);
    client.println("Content-Type: application/json");
    client.println("Accept: application/json");
    client.println("Prefer: return=minimal");
    client.print("apikey: ");
    client.println(apiKey);
    client.print("Authorization: Bearer ");
    client.println(apiKey);
    client.print("Content-Length: ");
    client.println(json.length());
    client.println();
    client.println(json);

    delay(1500);

    Serial.println("---- RESPONSE ----");

    while (client.available()) {
      String line = client.readStringUntil('\n');
      Serial.println(line);
    }

    client.stop();

  } else {
    Serial.println("Connection failed!");
  }

  // send every 10 seconds
  delay(10000);
}
