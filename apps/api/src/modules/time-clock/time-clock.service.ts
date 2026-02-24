import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { TimeClock } from '../../entities/time-clock.entity';
import { Employee } from '../../entities/employee.entity';
import { Location } from '../../entities/location.entity';
import { Area } from '../../entities/area.entity';
import { haversineDistance } from '@sigeo/shared';
import { timeClockSchema } from '@sigeo/shared';
import type { TimeClockInput } from '@sigeo/shared';

@Injectable()
export class TimeClockService {
  constructor(
    @InjectRepository(TimeClock)
    private readonly repo: Repository<TimeClock>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
    @InjectRepository(Area)
    private readonly areaRepo: Repository<Area>,
  ) {}

  async register(
    employeeId: string,
    dto: Omit<TimeClockInput, 'type'> & { type: 'CHECKIN' | 'CHECKOUT'; areaId?: string },
    photo: { url: string; key: string },
  ): Promise<TimeClock> {
    const data = timeClockSchema.parse({ ...dto, type: dto.type });

    const employee = await this.employeeRepo.findOne({ where: { id: employeeId } });
    if (!employee) throw new BadRequestException('Funcionário não encontrado');
    if (employee.status !== 'ACTIVE') {
      throw new BadRequestException('Funcionário inativo não pode registrar ponto');
    }

    let effectiveType = data.type as string;

    if (data.type === 'CHECKIN') {
      const { refLat, refLng, radius } = await this.getGeofenceRef(employeeId, dto.areaId);
      if (refLat != null && refLng != null && radius != null && data.lat != null && data.lng != null) {
        const dist = haversineDistance(
          { lat: Number(data.lat), lng: Number(data.lng) },
          { lat: refLat, lng: refLng },
        );
        if (dist > radius) {
          effectiveType = 'CHECKIN_FORA_DE_AREA';
        }
      }
    }

    const e = this.repo.create({
      id: uuid(),
      employeeId,
      type: effectiveType,
      lat: data.lat,
      lng: data.lng,
      photoUrl: photo.url,
      photoKey: photo.key,
    });
    return this.repo.save(e);
  }

  /** Retorna referência de geofencing: lat, lng e raio em km. */
  private async getGeofenceRef(
    employeeId: string,
    areaId?: string,
  ): Promise<{ refLat: number | null; refLng: number | null; radius: number | null }> {
    if (areaId) {
      const area = await this.areaRepo.findOne({
        where: { id: areaId },
        relations: [],
      });
      if (!area) return { refLat: null, refLng: null, radius: null };
      const loc = await this.locationRepo.findOne({ where: { id: area.locationId } });
      if (!loc || loc.lat == null || loc.lng == null) return { refLat: null, refLng: null, radius: null };
      const radius = area.raioPermitido ?? loc.radius ?? null;
      return { refLat: loc.lat, refLng: loc.lng, radius };
    }

    const employee = await this.employeeRepo.findOne({ where: { id: employeeId } });
    if (!employee) return { refLat: null, refLng: null, radius: null };
    const unit = await this.locationRepo.findOne({ where: { id: employee.unitId } });
    if (!unit || unit.lat == null || unit.lng == null || unit.radius == null) {
      return { refLat: null, refLng: null, radius: null };
    }
    return { refLat: unit.lat, refLng: unit.lng, radius: unit.radius };
  }

  async findByEmployee(employeeId: string, limit = 50): Promise<TimeClock[]> {
    return this.repo.find({
      where: { employeeId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
