import { Module, Global } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { MqttGateway } from './mqtt.gateway';

@Global()
@Module({
  providers: [MqttService, MqttGateway],
  exports: [MqttService],
})
export class MqttModule {}