import { QueueEventsListener, QueueEventsHost, OnQueueEvent } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evidencia } from '../../entities/evidencia.entity';
import { VisionAlertsGateway } from './vision-alerts.gateway';
import { VISION_QUEUE, type VisionJobData } from './vision.processor';

@Injectable()
@QueueEventsListener(VISION_QUEUE)
export class VisionQueueEventsListener extends QueueEventsHost {
  constructor(
    @InjectQueue(VISION_QUEUE)
    private readonly queue: Queue,
    private readonly alertsGateway: VisionAlertsGateway,
    @InjectRepository(Evidencia)
    private readonly evidenciaRepo: Repository<Evidencia>,
  ) {
    super();
  }

  @OnQueueEvent('failed')
  async onFailed(payload: { jobId: string; failedReason?: string }) {
    const job = await this.queue.getJob(payload.jobId);
    if (!job || !job.data) return;
    const data = job.data as VisionJobData;
    const evidencia = await this.evidenciaRepo.findOne({ where: { id: data.evidenciaId } });
    if (evidencia) {
      evidencia.status = 'AGUARDANDO_REVISAO_MANUAL';
      evidencia.detalhes = `Falha após 3 tentativas: ${payload.failedReason ?? 'erro desconhecido'}`;
      evidencia.limpo = null;
      evidencia.confianca = 0;
      evidencia.rawResponse = { failed: true, reason: payload.failedReason };
      await this.evidenciaRepo.save(evidencia);
    }
    this.alertsGateway.emitCircuitOpen();
  }
}
