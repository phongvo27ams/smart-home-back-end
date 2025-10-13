import { forwardRef, Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sensor } from './sensor.entity';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { UpdateSensorDto } from './dto/update-sensor.dto';
import { DeviceService } from '../device/device.service';
import { RelayControlService } from 'src/relay-control/relay-control.service';
import { Device } from '../device/device.entity';

@Injectable()
export class SensorService {
  constructor(
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,

    private readonly deviceService: DeviceService,

    @Inject(forwardRef(() => RelayControlService))
    private readonly relayControlService: RelayControlService,
  ) { }

  async create(dto: CreateSensorDto): Promise<Sensor> {
    if (!dto.deviceId) {
      throw new BadRequestException('deviceId is required when creating a sensor');
    }

    const device: Device = await this.deviceService.findOne(dto.deviceId);
    if (!device) {
      throw new NotFoundException(`Device #${dto.deviceId} not found`);
    }

    const sensor = this.sensorRepository.create({
      name: dto.name,
      type: dto.type,
      value: dto.value ?? 0,
      device,
    });

    return await this.sensorRepository.save(sensor);
  }

  async findAll(): Promise<Sensor[]> {
    return await this.sensorRepository.find({ relations: ['device'] });
  }

  async findOne(id: number): Promise<Sensor> {
    const sensor = await this.sensorRepository.findOne({
      where: { id },
      relations: ['device'],
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor #${id} not found`);
    }

    return sensor;
  }

  async update(id: number, dto: UpdateSensorDto): Promise<Sensor> {
    const sensor = await this.findOne(id);

    if (dto.deviceId) {
      const device = await this.deviceService.findOne(dto.deviceId);
      sensor.device = device;
    }

    Object.assign(sensor, dto);
    return await this.sensorRepository.save(sensor);
  }

  async remove(id: number): Promise<void> {
    const sensor = await this.findOne(id);
    await this.sensorRepository.remove(sensor);
  }

  async updateValue(id: number, value: number): Promise<Sensor> {
    const sensor = await this.findOne(id);
    sensor.value = value;

    // Save new sensor value
    await this.sensorRepository.save(sensor);

    // Get current device (avoid cache)
    const device = await this.deviceService.findOne(sensor.device.id);

    // Check the device status
    if (value === 0 && device.isOn) {
      await this.deviceService.toggleDevice(device.id, undefined);

      // Record in Relay Control
      await this.relayControlService.create({
        deviceId: device.id,
        action: 'OFF',
        isAutomatic: true,
        userId: undefined,
      });
    }

    // Reload the sensor value
    const reloadedSensor = await this.findOne(id);
    return reloadedSensor;
  }

}