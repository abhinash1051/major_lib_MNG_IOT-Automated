#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>

// --- (1) Hardware Definitions ---
LiquidCrystal_I2C lcd(0x27, 16, 2); // Change to 0x3F if needed

#define SS_PIN 10
#define RST_PIN 9
#define LED_G 5
#define LED_R 4
#define BUZZER 2

MFRC522 mfrc522(SS_PIN, RST_PIN);

// --- (2) WiFi & Backend Configuration ---
const char *ssid = "YOUR_WIFI_SSID";                                     // ⚠️ CHANGE THIS
const char *password = "YOUR_WIFI_PASSWORD";                             // ⚠️ CHANGE THIS
const char *serverName = "http://YOUR_BACKEND_IP:5000/api/arduino/data"; // ⚠️ CHANGE THIS

// --- (3) Library Capacity ---
#define TOTAL_LIBRARY_SEATS 50
int studentsInsideCount = 0;

// --- (4) User and Time Data ---
struct UserData
{
  String cardUID;
  String name;
  String enrollmentNumber;
  String department;
  String year;
  String lastTimeIn;
  bool isInside;
};

UserData userList[] = {
    {"04b4902a9f1c90", "Shruti", "E-1004", "CSE", "2nd", "", false},
    {"81934043", "Student Two", "E-1002", "ECE", "1st", "", false},
    {"91693e43", "Student Three", "E-1003", "ME", "3rd", "", false},
    {"c340f27", "Abhinesh Kumar", "0322", "CSE", "2nd", "", false},

    // Existing card (6-byte UID)
    {"440a19af91a90", "Vansh", "03220802822", "CSE", "3rd", "", false},

    // ✅ NEW CARD 1 – UID: F3 24 21 3B
    {"f324213b", "Ankur", "E-1101", "CSE", "1st", "", false},

    // ✅ NEW CARD 2 – UID: 04 6A 9A DA 9F 1C 90
    {"046a9ada9f1c90", "Prach", "E-1102", "ECE", "2nd", "", false}};

const int userCount = sizeof(userList) / sizeof(userList[0]);

// --- (5) Helper Functions ---
String getCurrentTime()
{
  // This is a simplified time function. For a real application, consider using an NTP client.
  unsigned long elapsedSeconds = millis() / 1000;
  int hours = (elapsedSeconds / 3600) % 24;
  int minutes = (elapsedSeconds % 3600) / 60;
  int seconds = elapsedSeconds % 60;
  char formattedTime[9];
  sprintf(formattedTime, "%02d:%02d:%02d", hours, minutes, seconds);
  return String(formattedTime);
}

int findUserIndex(String cardNumber)
{
  for (int i = 0; i < userCount; i++)
  {
    if (userList[i].cardUID == cardNumber)
    {
      return i;
    }
  }
  return -1;
}

void sendDataToBackend(String csvData)
{
  if (WiFi.status() == WL_CONNECTED)
  {
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"data\":\"" + csvData + "\"}";
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0)
    {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
    }
    else
    {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  }
  else
  {
    Serial.println("WiFi Disconnected");
  }
}

void setup()
{
  Serial.begin(9600);
  SPI.begin();
  mfrc522.PCD_Init();
  lcd.init();
  lcd.backlight();

  pinMode(LED_G, OUTPUT);
  pinMode(LED_R, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  noTone(BUZZER);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  updateIdleScreen();
}

void loop()
{
  if (!mfrc522.PICC_IsNewCardPresent())
    return;
  if (!mfrc522.PICC_ReadCardSerial())
    return;

  String cardNumber = "";
  for (byte i = 0; i < mfrc522.uid.size; i++)
  {
    cardNumber += String(mfrc522.uid.uidByte[i], HEX);
  }

  String currentTime = getCurrentTime();
  String timeIn = "-", timeOut = "-", status = "Unknown";
  String csvData = "";

  int userIndex = findUserIndex(cardNumber);

  if (userIndex != -1)
  {
    UserData &user = userList[userIndex];

    if (!user.isInside)
    {
      user.lastTimeIn = currentTime;
      user.isInside = true;
      timeIn = user.lastTimeIn;
      status = "ENTERED";
      studentsInsideCount++;
      grantAccess(user.name, "AUTHORIZED");
    }
    else
    {
      timeIn = user.lastTimeIn;
      timeOut = currentTime;
      user.isInside = false;
      status = "EXITED";
      studentsInsideCount--;
      grantAccess(user.name, "LOGGED OUT");
    }

    csvData = user.name + "," + user.enrollmentNumber + "," + user.department + "," + user.year + "," + timeIn + "," + timeOut + "," + status;
    sendDataToBackend(csvData);
  }
  else
  {
    status = "UNAUTHORIZED";
    unauthorizedAccess();
    csvData = "Unknown Card," + cardNumber + ",Unknown,Unknown," + currentTime + ",-," + status;
    sendDataToBackend(csvData);
  }

  delay(1000);
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  updateIdleScreen();
}

void updateIdleScreen()
{
  int availableSeats = TOTAL_LIBRARY_SEATS - studentsInsideCount;
  if (availableSeats < 0)
  {
    availableSeats = 0;
  }
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Seats: ");
  lcd.print(availableSeats);
  lcd.print("/");
  lcd.print(TOTAL_LIBRARY_SEATS);
  lcd.setCursor(0, 1);
  lcd.print("Inside: ");
  lcd.print(studentsInsideCount);
}

void grantAccess(String name, String message)
{
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(name);
  lcd.setCursor(0, 1);
  lcd.print(message);
  digitalWrite(LED_G, HIGH);
  tone(BUZZER, 700);
  delay(300);
  noTone(BUZZER);
  delay(1500);
  digitalWrite(LED_G, LOW);
}

void unauthorizedAccess()
{
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("UNAUTHORIZED");
  lcd.setCursor(0, 1);
  lcd.print("ACCESS");
  digitalWrite(LED_R, HIGH);
  tone(BUZZER, 300);
  delay(2000);
  digitalWrite(LED_R, LOW);
  noTone(BUZZER);
}