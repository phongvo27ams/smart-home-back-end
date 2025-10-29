import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient;

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
      keepalive: 60,
    });

    this.client.on('connect', () => {
      this.logger.log(`Connected to Ohstem MQTT broker as ${this.CLIENT_ID}`);
    });

    this.client.on('reconnect', () => {
      this.logger.warn('Reconnecting to MQTT broker...');
    });

    this.client.on('error', (err) => {
      this.logger.error(`MQTT Error: ${err.message}`);
    });

    this.client.on('close', () => {
      this.logger.warn('MQTT connection closed');
    });

    this.client.on('message', (topic, message) => {
      this.logger.debug(`Received from ${topic}: ${message.toString()}`);
    });
  }

  /** Publish message to topic */
  publish(topic: string, message: string) {
    if (!this.client?.connected) {
      this.logger.error('Cannot publish: MQTT client not connected');
      return;
    }

    this.client.publish(topic, message, { qos: 0, retain: false }, (err) => {
      if (err) this.logger.error(`Publish error to ${topic}: ${err.message}`);
      else this.logger.log(`Published "${message}" to topic "${topic}"`);
    });
  }

  subscribe(topic: string) {
    if (!this.client?.connected) {
      this.logger.warn('Cannot subscribe: MQTT client not connected');
      return;
    }

    this.client.subscribe(topic, { qos: 0 }, (err) => {
      if (err) this.logger.error(`Subscribe error: ${err.message}`);
      else this.logger.log(`Subscribed to topic "${topic}"`);
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.logger.log('Closing MQTT connection...');
      this.client.end();
    }
  }
}