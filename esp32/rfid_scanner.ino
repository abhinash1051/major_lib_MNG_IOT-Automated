#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <MFRC522.h>
#include <SPI.h>

// Network credentials
const char *ssid = "YOUR_WIFI_SSID";
const char *password = "YOUR_WIFI_PASSWORD";

// API endpoint
const char *serverUrl = "http://YOUR_SERVER_IP:5000/api/hardware/scan";

// RFID pins
#define SS_PIN 5
#define RST_PIN 22
#define LED_PIN 2 // Built-in LED

// Initialize RFID reader
MFRC522 rfid(SS_PIN, RST_PIN);

// Variables
String lastScannedUID = "";
unsigned long lastScanTime = 0;
const unsigned long scanCooldown = 3000; // 3 seconds cooldown between scans

void setup() {
  // Initialize serial communication
  Serial.begin(115200);

  // Initialize LED pin
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Initialize SPI bus
  SPI.begin();

  // Initialize RFID reader
  rfid.PCD_Init();
  Serial.println("RFID Reader initialized");

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  // Blink LED to indicate successful connection
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}

void loop() {
  // Check if WiFi is still connected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
    }

    Serial.println("");
    Serial.println("WiFi reconnected");
  }

  // Check if a new card is present
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    // Get current time
    unsigned long currentTime = millis();

    // Get UID
    String uid = getUID();

    // Check if it's a new card or if cooldown has passed
    if (uid != lastScannedUID || (currentTime - lastScanTime >= scanCooldown)) {
      // Update last scanned UID and time
      lastScannedUID = uid;
      lastScanTime = currentTime;

      // Blink LED to indicate successful scan
      digitalWrite(LED_PIN, HIGH);

      // Send UID to server
      sendUIDToServer(uid);

      // Turn off LED after a short delay
      delay(200);
      digitalWrite(LED_PIN, LOW);
    }

    // Halt PICC
    rfid.PICC_HaltA();
    // Stop encryption on PCD
    rfid.PCD_StopCrypto1();
  }

  // Small delay to prevent excessive CPU usage
  delay(100);
}

// Function to get UID as a string
String getUID() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    uid += (rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

// Function to send UID to server
void sendUIDToServer(String uid) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    // Configure HTTP request
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["rfidUID"] = uid;
    doc["deviceId"] = "ESP32_ENTRANCE"; // Change this for different locations

    String requestBody;
    serializeJson(doc, requestBody);

    // Send HTTP POST request
    int httpResponseCode = http.POST(requestBody);

    // Check response
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println("Response: " + response);

      // Parse response
      StaticJsonDocument<512> responseDoc;
      DeserializationError error = deserializeJson(responseDoc, response);

      if (!error) {
        // Check if student was found
        bool success = responseDoc["success"];
        if (success) {
          String studentName = responseDoc["student"]["name"];
          String eventType = responseDoc["log"]["eventType"];

          Serial.print("Student: ");
          Serial.print(studentName);
          Serial.print(" - ");
          Serial.println(eventType == "entry" ? "Entered" : "Exited");

          // Blink LED pattern based on entry/exit
          if (eventType == "entry") {
            // Double blink for entry
            for (int i = 0; i < 2; i++) {
              digitalWrite(LED_PIN, HIGH);
              delay(200);
              digitalWrite(LED_PIN, LOW);
              delay(200);
            }
          } else {
            // Single long blink for exit
            digitalWrite(LED_PIN, HIGH);
            delay(500);
            digitalWrite(LED_PIN, LOW);
          }
        } else {
          // Student not found - rapid blink to indicate error
          for (int i = 0; i < 5; i++) {
            digitalWrite(LED_PIN, HIGH);
            delay(100);
            digitalWrite(LED_PIN, LOW);
            delay(100);
          }

          Serial.println("Student not found for RFID: " + uid);
        }
      } else {
        Serial.println("Error parsing JSON response");
      }
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);

      // Rapid blink to indicate error
      for (int i = 0; i < 5; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(100);
        digitalWrite(LED_PIN, LOW);
        delay(100);
      }
    }

    // Free resources
    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}