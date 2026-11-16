// MQTT Configuration
export const websocketUrl = "ws://allcad-chennai.selfip.com:3000/";
export const WebSocketInterval = 1000;
export const WebSocketEnableLoop = 1;
export const bitrixBroker = "undefined";
export const bitrixTopic = "bitrix/66db32e7-4b67-4a8c-9e9a-94c26c286b4d";
export const bitrixUsername = "admin";
export const bitrixPassword = "Admin@321";
export const scadamqttBroker = "undefined";
export const scadamqttTopic = "ctcu-8a6b-9e65-f905-1878/Registers";
export const scadamqttUsername = "admin";
export const scadamqttPassword = "Admin@321";
export const fileList = "";

// MQTT Configuration object
export const mqttconfig = {
  mqtt: {
    broker: bitrixBroker,
    topic: bitrixTopic,
    username: bitrixUsername,
    password: bitrixPassword,
    clientId: bitrixTopic + Math.random().toString(16).substr(3, 9),
  },
  scadamqtt: {
    broker: scadamqttBroker,
    topic: scadamqttTopic,
    username: scadamqttUsername,
    password: scadamqttPassword,
    clientId: scadamqttTopic + Math.random().toString(16).substr(3, 9),
  }
};

// Ignore folders
export const ignoreFolders = ["API", "SCADAMQTT"];