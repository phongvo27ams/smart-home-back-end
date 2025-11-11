import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { MqttService } from './mqtt.service';

@WebSocketGateway({ cors: { origin: 'http://localhost:3001' } })
@Injectable()
export class MqttGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MqttGateway.name);

  constructor(private readonly mqttService: MqttService) {}

  afterInit() {
    this.mqttService.onMessage((topic, message) => {
      const value = parseFloat(message.toString());
      this.logger.log(`Forwarding MQTT message ${value} from ${topic} to WebSocket clients`);
      this.server.emit('sensorData', { topic, value, time: new Date().toISOString() });
    });

    this.logger.log('MQTT Gateway initialized');
  }
}