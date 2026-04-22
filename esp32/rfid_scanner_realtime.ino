// --------------------RFID Library Management System (Arduino)----------------------
// - Verifies students from a built-in list
// - Counts students IN/OUT and calculates available seats
// - Displays student name on entry/exit
// - Displays seat/inside count on idle screen
// - Sends JSON data to PC via Serial (to Node.js backend)
// --------------------Arduino Code for Real-Time Integration---------------------

#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h> // Install: Sketch > Include Library > Manage Libraries > ArduinoJson

// --- (1) Hardware Definitions ---
LiquidCrystal_I2C lcd(0x27, 16, 2); // Change to 0x3F if your LCD address differs

#define SS_PIN 10
#define RST_PIN 9
#define LED_G 5  // Green LED
#define LED_R 4  // Red LED
#define BUZZER 2 // Buzzer

MFRC522 mfrc522(SS_PIN, RST_PIN);

// --- (2) Library Capacity ---
#define TOTAL_LIBRARY_SEATS 250
int studentsInsideCount = 0;

// --- (3) User and Time Data ---
unsigned long startMillis;
int startHours = 12, startMinutes = 55, startSeconds = 50;

// Data structure for each verified student
struct UserData
{
    String cardUID;
    String name;
    String enrollmentNumber;
    String rfidUID;
    String department;
    String year;
    String lastTimeIn;
    bool isInside;
};

// --- (4) Verified Student Data (from JSON or hardcoded) ---
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
    unsigned long elapsedSeconds = (millis() - startMillis) / 1000;
    int currentHours = startHours + (elapsedSeconds / 3600);
    int currentMinutes = startMinutes + ((elapsedSeconds % 3600) / 60);
    int currentSeconds = startSeconds + (elapsedSeconds % 60);

    if (currentSeconds >= 60)
    {
        currentMinutes += currentSeconds / 60;
        currentSeconds %= 60;
    }
    if (currentMinutes >= 60)
    {
        currentHours += currentMinutes / 60;
        currentMinutes %= 60;
    }
    if (currentHours >= 24)
    {
        currentHours %= 24;
    }

    char formattedTime[9];
    sprintf(formattedTime, "%02d:%02d:%02d", currentHours, currentMinutes, currentSeconds);
    return String(formattedTime);
}

// Search user list for matching UID
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

// --- (6) LCD/LED Feedback Functions ---

void updateIdleScreen()
{
    int availableSeats = TOTAL_LIBRARY_SEATS - studentsInsideCount;
    if (availableSeats < 0)
        availableSeats = 0;

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

// --- (7) Send JSON data to Node.js backend via Serial ---
void sendScanData(String cardUID, String name, String enrollmentNumber, String department,
                  String year, String timeIn, String timeOut, String status, bool authorized)
{
    StaticJsonDocument<256> doc;
    doc["uid"] = cardUID;
    doc["name"] = name;
    doc["enrollmentNumber"] = enrollmentNumber;
    doc["department"] = department;
    doc["year"] = year;
    doc["timeIn"] = timeIn;
    doc["timeOut"] = timeOut;
    doc["status"] = status;
    doc["authorized"] = authorized;
    doc["timestamp"] = getCurrentTime();
    doc["studentsInside"] = studentsInsideCount;
    doc["totalSeats"] = TOTAL_LIBRARY_SEATS;

    serializeJson(doc, Serial);
    Serial.println(); // End of JSON with newline
}

// --- (8) Setup ---

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

    startMillis = millis();

    updateIdleScreen();
}

// --- (9) Main Loop ---

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
    cardNumber.toLowerCase(); // Normalize UID

    String currentTime = getCurrentTime();
    String timeIn = "-", timeOut = "-", status = "Unknown";

    int userIndex = findUserIndex(cardNumber);

    if (userIndex != -1)
    {
        UserData &user = userList[userIndex];

        if (!user.isInside)
        {
            user.lastTimeIn = currentTime;
            user.isInside = true;
            timeIn = user.lastTimeIn;
            status = "ENTRY";
            studentsInsideCount++;
            grantAccess(user.name, "AUTHORIZED");
            sendScanData(user.cardUID, user.name, user.enrollmentNumber, user.department, user.year, timeIn, "-", status, true);
        }
        else
        {
            timeIn = user.lastTimeIn;
            timeOut = currentTime;
            user.isInside = false;
            status = "EXIT";
            studentsInsideCount--;
            grantAccess(user.name, "LOGGED OUT");
            sendScanData(user.cardUID, user.name, user.enrollmentNumber, user.department, user.year, timeIn, timeOut, status, true);
        }
    }
    else
    {
        status = "UNAUTHORIZED";
        unauthorizedAccess();
        sendScanData(cardNumber, "Unknown", "Unknown", "Unknown", "Unknown", currentTime, "-", status, false);
    }

    delay(1000);
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    updateIdleScreen();
}
