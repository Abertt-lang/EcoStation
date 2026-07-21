#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <DHT.h>
#include <Adafruit_BMP280.h>
#include <TinyGPSPlus.h>

// --- CONFIGURACIÓN WI-FI ---
#define WIFI_SSID "Dar"
#define WIFI_PASSWORD "1alnumero8"

// --- CONFIGURACIÓN FIREBASE ---
#define FIREBASE_API_KEY "AIzaSyBacZMSOHHiHs2xLaH2v9TBW2P2jiwPVOM"
#define FIREBASE_PROJECT_ID "mapstation-27e71"
#define USER_EMAIL "estacion@ecomap.com"
#define USER_PASSWORD "123456"

// --- PINES DE SENSORES ---
#define DHTPIN 4
#define DHTTYPE DHT22
#define MQ135_PIN 34
#define SOUND_PIN 35
#define LDR_PIN 32

// --- PINES LED RGB (Ánodo Común) ---
#define LED_R 25
#define LED_G 26
#define LED_B 27

// --- OBJETOS GLOBALES ---
DHT dht(DHTPIN, DHTTYPE);
Adafruit_BMP280 bmp;
TinyGPSPlus gps;
HardwareSerial neogps(2);

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

int simulatedBattery = 100;
void enviarDatosFirebase();

// Función para controlar el color del LED (Ánodo Común)
// Como es Ánodo Común, se enciende con valores cercanos a 0
void setColor(int r, int g, int b) {
  ledcWrite(1, 255 - r);
  ledcWrite(2, 255 - g);
  ledcWrite(3, 255 - b);
}

void setup() {
  Serial.begin(115200);
  neogps.begin(115200, SERIAL_8N1, 16, 17);

  // Iniciar sensores
  dht.begin();
  if (!bmp.begin(0x76)) {
    Serial.println("No se encontró el BMP280!");
  }

  // Configurar pines del LED RGB
  ledcSetup(1, 5000, 8);
  ledcAttachPin(LED_R, 1);
  ledcSetup(2, 5000, 8);
  ledcAttachPin(LED_G, 2);
  ledcSetup(3, 5000, 8);
  ledcAttachPin(LED_B, 3);

  setColor(0, 0, 255); // AZUL al encender (Buscando WiFi)

  // Conectar WiFi
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(1000);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando a WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi conectado!");
  setColor(0, 255, 0); // VERDE: WiFi conectado

  // Configurar Firebase
  config.api_key = FIREBASE_API_KEY;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  while (neogps.available()) {
    gps.encode(neogps.read());
  }

  // Si pierde el WiFi, poner el LED en ROJO
  if (WiFi.status() != WL_CONNECTED) {
    setColor(255, 0, 0); // ROJO
  }

  if (Firebase.ready() && WiFi.status() == WL_CONNECTED) {
    enviarDatosFirebase();
    Serial.println("Esperando 10 segundos...");
    delay(3000); // 10 segundos para pruebas
  }
}

void enviarDatosFirebase() {
  // 1. Leer sensores
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  float pres = bmp.readPressure() / 100.0F;
  
  // Leer Calidad del Aire (Calibrado)
  int airQualityRaw = analogRead(MQ135_PIN);
  int airQualityMap = map(airQualityRaw, 800, 4095, 0, 500); 
  if (airQualityMap < 0) airQualityMap = 0;
  if (airQualityMap > 500) airQualityMap = 500;
  
  // Leer Sonido (Ultra sensible)
  unsigned long startTime = millis();
  int sample;
  int maxSound = 0;
  while (millis() - startTime < 50) {
    sample = analogRead(SOUND_PIN);
    if (sample > maxSound) maxSound = sample;
  }
  float soundDb = map(maxSound, 1500, 1700, 30, 90);
  if (soundDb > 90) soundDb = 90;
  if (soundDb < 30) soundDb = 30;
  
  // Leer Luz (Calibrado)
  int ldrRaw = analogRead(LDR_PIN);
  int lightLux = map(ldrRaw, 2400, 4095, 0, 1000);
  if (lightLux < 0) lightLux = 0;
  if (lightLux > 1000) lightLux = 1000;
  
  // Leer GPS
  float lat = gps.location.isValid() ? gps.location.lat() : 4.7110;
  float lng = gps.location.isValid() ? gps.location.lng() : -74.0721;

  // Simulaciones
  simulatedBattery = simulatedBattery > 20 ? simulatedBattery - 1 : 100;
  int wifiRSSI = WiFi.RSSI();

  // --- LÓGICA DEL LED RGB SEGÚN LOS SENSORES ---
  if (airQualityMap > 150 || soundDb > 80) {
    setColor(255, 0, 0); // ROJO: Alerta crítica (Aire muy malo o ruido excesivo)
  } else if (airQualityMap > 80 || soundDb > 60 || simulatedBattery < 30) {
    setColor(255, 255, 0); // AMARILLO: Alerta media
  } else {
    setColor(0, 255, 0); // VERDE: Todo en orden
  }
  // ---------------------------------------------

  // 2. Crear documento JSON para Firestore
  FirebaseJson content;
  content.set("fields/idEstacion/stringValue", "ESP32-001");
  content.set("fields/nombre/stringValue", "Estación Patio Central");
  content.set("fields/temperatura/doubleValue", temp);
  content.set("fields/humedad/doubleValue", hum);
  content.set("fields/presion/doubleValue", pres);
  content.set("fields/calidadAire/integerValue", airQualityMap);
  content.set("fields/ruido/doubleValue", soundDb);
  content.set("fields/luz/integerValue", lightLux);
  content.set("fields/latitud/doubleValue", lat);
  content.set("fields/longitud/doubleValue", lng);
  content.set("fields/fecha/stringValue", String(millis()));
  content.set("fields/bateria/integerValue", simulatedBattery);
  content.set("fields/wifi/integerValue", wifiRSSI);
  content.set("fields/estado/stringValue", "online");

  // 3. Enviar a Firestore
  String documentPath = "stations/ESP32-001";

  Serial.println("Enviando datos a Firestore...");
  if (Firebase.Firestore.patchDocument(&fbdo, FIREBASE_PROJECT_ID, "", documentPath.c_str(), content.raw(), "")) {
    Serial.println("Datos actualizados correctamente!");
  } else {
    Serial.print("FALLO al enviar: ");
    Serial.println(fbdo.errorReason());
  }
}