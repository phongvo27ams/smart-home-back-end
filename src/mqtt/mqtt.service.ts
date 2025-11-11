import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient;
  private onMessageCallback?: (topic: string, message: Buffer) => void;

  private readonly MQTT_HOST = 'mqtt.ohstem.vn';
  private readonly MQTT_PORT = 1883;
  private readonly MQTT_USERNAME = '27C45UV';
  private readonly MQTT_PASSWORD = '';
  private readonly CLIENT_ID = 'nestjs-' + Math.random().toString(16).substr(2, 8);

  onModuleInit() {
    this.connectToBroker();
  }

  private connectToBroker() {
    const url = `mqtt://${this.MQTT_HOST}:${this.MQTT_PORT}`;
    this.client = mqtt.connect(url, {
      clientId: this.CLIENT_ID,
      username: this.MQTT_USERNAME,
      password: this.MQTT_PASSWORD,
      reconnectPeriod: 3000,
    });

    this.client.on('connect', () => {
      this.logger.log(`Connected to MQTT broker as ${this.CLIENT_ID}`);
      // Khi connect, subscribe luôn topic
      this.subscribe('27C45UV/feeds/V1');
    });

    this.client.on('error', (err) => {
      this.logger.error(`MQTT error: ${err.message}`);
    });

    // Luôn lắng nghe message
    this.client.on('message', (topic, message) => {
      this.logger.log(`MQTT message received on ${topic}: ${message.toString()}`);
      if (this.onMessageCallback) {
        this.onMessageCallback(topic, message);
      }
    });
  }

  publish(topic: string, message: string) {
    if (!this.client?.connected) return this.logger.error('Cannot publish: MQTT client not connected');
    this.client.publish(topic, message, { qos: 0, retain: false }, (err) => {
      if (err) this.logger.error(`Publish error: ${err.message}`);
      else this.logger.log(`Published "${message}" to topic "${topic}"`);
    });
  }

  subscribe(topic: string) {
    if (!this.client?.connected) return this.logger.warn(`MQTT not connected, will subscribe to ${topic} on connect`);
    this.client.subscribe(topic, { qos: 0 }, (err) => {
      if (err) this.logger.error(`Subscribe error: ${err.message}`);
      else this.logger.log(`Subscribed to ${topic}`);
    });
  }

  onMessage(callback: (topic: string, message: Buffer) => void) {
    this.onMessageCallback = callback;
  }

  onModuleDestroy() {
    if (this.client) {
      this.logger.log('Closing MQTT connection...');
      this.client.end();
    }
  }
}