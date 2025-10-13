import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Sensor } from './sensor.entity';
import { SensorService } from './sensor.service';
import { SensorController } from './sensor.controller';
import { DeviceModule } from '../device/device.module';
import { RelayControlModule } from 'src/relay-control/relay-control.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sensor]),
    forwardRef(() => DeviceModule),
    forwardRef(() => RelayControlModule),
  ],
  controllers: [SensorController],
  providers: [SensorService],
  exports: [SensorService],
})
export class SensorModule { }