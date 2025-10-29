import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './device.entity';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { RelayControlModule } from '../relay-control/relay-control.module';
import { MqttService } from '../mqtt/mqtt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device]),
    forwardRef(() => RelayControlModule)
  ],
  controllers: [DeviceController],
  providers: [DeviceService, MqttService],
  exports: [DeviceService],
})

export class DeviceModule { }