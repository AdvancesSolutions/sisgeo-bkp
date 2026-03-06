import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { PlantaBaixa } from '../../entities/planta-baixa.entity';
import { AreaZone } from '../../entities/area-zone.entity';
import { Area } from '../../entities/area.entity';
import { Task } from '../../entities/task.entity';
import { Incident } from '../../entities/incident.entity';
import { OcorrenciaEmergencial } from '../../entities/ocorrencia-emergencial.entity';
import { ScoreDiario } from '../../entities/score-diario.entity';
import { Ativo } from '../../entities/ativo.entity';
import { UploadService } from '../upload/upload.service';

export type HygieneStatus = 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL';

export interface AreaHygieneStatus {
  areaId: string;
  areaName: string;
  status: HygieneStatus;
  lastCleanAt: Date | null;
  hoursSinceLastClean: number | null;
  findMeScore: number | null;
  lastEmployeeName: string | null;
  hasOpenOccurrence: boolean;
  isTaskLate: boolean;
}

export interface ZoneWithStatus {
  zoneId: string;
  areaId: string;
  areaName: string;
  polygon: { x: number; y: number }[];
  status: HygieneStatus;
  lastCleanAt: Date | null;
  hoursSinceLastClean: number | null;
  findMeScore: number | null;
  lastEmployeeName: string | null;
  hasOpenOccurrence: boolean;
}

export interface DigitalTwinStatus {
  locationId: string;
  floorPlan: {
    id: string;
    imageUrl: string;
    width: number | null;
    height: number | null;
    floorNumber: number;
  } | null;
  zones: ZoneWithStatus[];
  openOccurrences: { areaId: string; type: string }[];
  ativosStatus: { id: string; nome: string; status: string }[];
}

const HOURS_GREEN = 2;
const HOURS_YELLOW = 4;

@Injectable()
export class DigitalTwinService {
  constructor(
    @InjectRepository(PlantaBaixa)
    private readonly plantaRepo: Repository<PlantaBaixa>,
    @InjectRepository(AreaZone)
    private readonly zoneRepo: Repository<AreaZone>,
    @InjectRepository(Area)
    private readonly areaRepo: Repository<Area>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
    @InjectRepository(OcorrenciaEmergencial)
    private readonly ocorrenciaRepo: Repository<OcorrenciaEmergencial>,
    @InjectRepository(ScoreDiario)
    private readonly scoreRepo: Repository<ScoreDiario>,
    @InjectRepository(Ativo)
    private readonly ativoRepo: Repository<Ativo>,
    private readonly upload: UploadService,
  ) {}

  /** Retorna status de higiene para todas as áreas de uma localização */
  async getHygieneStatusByLocation(locationId: string): Promise<AreaHygieneStatus[]> {
    const areas = await this.areaRepo.find({
      where: { locationId },
      relations: ['location'],
    });

    const results: AreaHygieneStatus[] = [];
    for (const area of areas) {
      const status = await this.computeAreaHygieneStatus(area.id);
      results.push(status);
    }
    return results;
  }

  /** Calcula status de higiene de uma área */
  private async computeAreaHygieneStatus(areaId: string): Promise<AreaHygieneStatus> {
    const area = await this.areaRepo.findOne({ where: { id: areaId } });
    if (!area) {
      return {
        areaId,
        areaName: 'Desconhecido',
        status: 'RED',
        lastCleanAt: null,
        hoursSinceLastClean: null,
        findMeScore: null,
        lastEmployeeName: null,
        hasOpenOccurrence: false,
        isTaskLate: false,
      };
    }

    const lastDoneTask = await this.taskRepo.findOne({
      where: { areaId, status: 'DONE' },
      relations: ['employee'],
      order: { completedAt: 'DESC' },
    });

    const lastCleanAt = lastDoneTask?.completedAt ?? null;
    const hoursSinceLastClean = lastCleanAt
      ? (Date.now() - new Date(lastCleanAt).getTime()) / (1000 * 60 * 60)
      : null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayScore = await this.scoreRepo.findOne({
      where: { areaId, referenceDate: today },
    });

    const openIncident = await this.incidentRepo.findOne({
      where: {
        areaId,
        type: 'FALTA_MATERIAL',
        status: In(['ABERTO', 'EM_ANALISE']),
      },
    });

    const openPanicoCount = await this.ocorrenciaRepo.count({
      where: { type: 'PANICO', resolvedAt: IsNull() },
    });

    const hasOpenOccurrence = !!openIncident || openPanicoCount > 0;

    const lateTask = await this.taskRepo.findOne({
      where: { areaId, status: 'LATE' },
    });
    const isTaskLate = !!lateTask;

    let status: HygieneStatus = 'RED';
    if (hasOpenOccurrence) status = 'CRITICAL';
    else if (isTaskLate) status = 'RED';
    else if (hoursSinceLastClean != null) {
      if (hoursSinceLastClean < HOURS_GREEN) status = 'GREEN';
      else if (hoursSinceLastClean < HOURS_YELLOW) status = 'YELLOW';
    }

    return {
      areaId,
      areaName: area.name,
      status,
      lastCleanAt,
      hoursSinceLastClean: hoursSinceLastClean ?? null,
      findMeScore: todayScore?.scoreTotal ?? null,
      lastEmployeeName: lastDoneTask?.employee?.name ?? null,
      hasOpenOccurrence,
      isTaskLate,
    };
  }

  /** Retorna dados completos para o mapa de calor (floor plan + zonas + status) */
  async getDigitalTwinStatus(
    locationId: string,
    options?: { floorNumber?: number; includeAtivos?: boolean; includeOccurrences?: boolean },
  ): Promise<DigitalTwinStatus> {
    const floorNumber = options?.floorNumber ?? 1;

    const planta = await this.plantaRepo.findOne({
      where: { locationId, floorNumber },
    });

    const zones: ZoneWithStatus[] = [];
    if (planta) {
      const areaZones = await this.zoneRepo.find({
        where: { plantaBaixaId: planta.id },
        relations: ['area'],
      });

      for (const az of areaZones) {
        const status = await this.computeAreaHygieneStatus(az.areaId);
        zones.push({
          zoneId: az.id,
          areaId: az.areaId,
          areaName: az.area?.name ?? status.areaName,
          polygon: az.polygon as { x: number; y: number }[],
          status: status.status,
          lastCleanAt: status.lastCleanAt,
          hoursSinceLastClean: status.hoursSinceLastClean ?? null,
          findMeScore: status.findMeScore,
          lastEmployeeName: status.lastEmployeeName,
          hasOpenOccurrence: status.hasOpenOccurrence,
        });
      }
    }

    const openOccurrences: { areaId: string; type: string }[] = [];
    if (options?.includeOccurrences !== false) {
      const incidents = await this.incidentRepo.find({
        where: { areaId: In(zones.map((z) => z.areaId)), status: In(['ABERTO', 'EM_ANALISE']) },
      });
      openOccurrences.push(...incidents.map((i) => ({ areaId: i.areaId!, type: i.type })));
    }

    const ativosStatus: { id: string; nome: string; status: string }[] = [];
    if (options?.includeAtivos) {
      const ativos = await this.ativoRepo.find({
        where: { locationId },
      });
      ativosStatus.push(...ativos.map((a) => ({ id: a.id, nome: a.nome, status: a.status })));
    }

    return {
      locationId,
      floorPlan: planta
        ? {
            id: planta.id,
            imageUrl: planta.imageUrl,
            width: planta.width,
            height: planta.height,
            floorNumber: planta.floorNumber,
          }
        : null,
      zones,
      openOccurrences,
      ativosStatus,
    };
  }

  /** Upload de planta baixa */
  async uploadFloorPlan(
    locationId: string,
    file: Express.Multer.File,
    floorNumber = 1,
  ): Promise<PlantaBaixa> {
    const prefix = 'floor-plans';
    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'png';
    const fullKey = `${prefix}/${locationId}-${floorNumber}.${ext}`;
    const { url, key: storedKey } = await this.upload.save(file, prefix, fullKey);

    const existing = await this.plantaRepo.findOne({
      where: { locationId, floorNumber },
    });

    const id = existing?.id ?? uuid();
    const entity = existing ?? this.plantaRepo.create({
      id,
      locationId,
      floorNumber,
      imageUrl: url,
      imageKey: storedKey,
    });
    entity.imageUrl = url;
    entity.imageKey = storedKey;
    await this.plantaRepo.save(entity);
    return entity;
  }

  /** Salva ou atualiza zona (mapeamento área -> polígono) */
  async saveZone(
    areaId: string,
    plantaBaixaId: string,
    polygon: { x: number; y: number }[],
  ): Promise<AreaZone> {
    const existing = await this.zoneRepo.findOne({
      where: { areaId, plantaBaixaId },
    });

    const id = existing?.id ?? uuid();
    const entity = existing ?? this.zoneRepo.create({
      id,
      areaId,
      plantaBaixaId,
      polygon: [],
    });
    entity.polygon = polygon;
    await this.zoneRepo.save(entity);
    return entity;
  }

  /** Lista zonas de uma planta */
  async getZones(plantaBaixaId: string): Promise<AreaZone[]> {
    return this.zoneRepo.find({
      where: { plantaBaixaId },
      relations: ['area'],
    });
  }

  /** Remove zona */
  async removeZone(zoneId: string): Promise<void> {
    await this.zoneRepo.delete(zoneId);
  }
}
