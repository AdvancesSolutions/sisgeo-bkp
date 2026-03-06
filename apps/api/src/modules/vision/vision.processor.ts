import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisionAIService } from '../../services/visionAI.service';
import { Evidencia } from '../../entities/evidencia.entity';
import { VisionCircuitBreakerService } from './vision-circuit-breaker.service';
import { VisionAlertsGateway } from './vision-alerts.gateway';
import type { VisionAnalysisResult } from '../../services/visionAI.service';

export const VISION_QUEUE = 'vision-analysis-queue';

export interface VisionJobData {
  evidenciaId: string;
  caminhoS3: string;
}

const BACKOFF_MS = [5000, 20000, 60000];
const CRITICAL_CONFIANCA_THRESHOLD = 30;

@Injectable()
@Processor(VISION_QUEUE, {
  concurrency: 2,
  settings: {
    backoffStrategy: (attemptsMade: number) => BACKOFF_MS[attemptsMade] ?? 60000,
  },
})
export class VisionProcessor extends WorkerHost {
  constructor(
    private readonly visionAI: VisionAIService,
    private readonly circuitBreaker: VisionCircuitBreakerService,
    private readonly alertsGateway: VisionAlertsGateway,
    @InjectRepository(Evidencia)
    private readonly evidenciaRepo: Repository<Evidencia>,
  ) {
    super();
  }

  async process(job: Job<VisionJobData>): Promise<void> {
    const { evidenciaId, caminhoS3 } = job.data;

    if (this.circuitBreaker.isCircuitOpen()) {
      await this.markManualReview(evidenciaId, 'Ollama indisponível há mais de 5 minutos.');
      this.alertsGateway.emitCircuitOpen();
      return;
    }

    let result: VisionAnalysisResult;
    try {
      result = await this.visionAI.analyzeWithOllama(caminhoS3);
      this.circuitBreaker.recordSuccess();
    } catch (err) {
      if (this.circuitBreaker.isCircuitOpen()) {
        await this.markManualReview(evidenciaId, `Erro Ollama: ${(err as Error).message}`);
        this.alertsGateway.emitCircuitOpen();
        return;
      }
      throw err;
    }

    const evidencia = await this.evidenciaRepo.findOne({ where: { id: evidenciaId } });
    if (!evidencia) {
      throw new Error(`Evidência ${evidenciaId} não encontrada`);
    }

    evidencia.limpo = result.limpo;
    evidencia.confianca = result.confianca;
    evidencia.detalhes = result.detalhes;
    evidencia.anomaliaDetectada = result.anomaliaDetectada;
    evidencia.status = result.status;
    evidencia.rawResponse = result.rawResponse ?? null;
    await this.evidenciaRepo.save(evidencia);

    if (result.confianca < CRITICAL_CONFIANCA_THRESHOLD) {
      this.alertsGateway.emitCriticalAlert({
        evidenciaId,
        taskPhotoId: evidencia.taskPhotoId,
        confianca: result.confianca,
        detalhes: result.detalhes,
        imageUrl: caminhoS3,
      });
    }
  }

  private async markManualReview(evidenciaId: string, detalhes: string): Promise<void> {
    const evidencia = await this.evidenciaRepo.findOne({ where: { id: evidenciaId } });
    if (evidencia) {
      evidencia.status = 'AGUARDANDO_REVISAO_MANUAL';
      evidencia.detalhes = detalhes;
      evidencia.limpo = null;
      evidencia.confianca = 0;
      evidencia.rawResponse = { circuitBreaker: true, message: detalhes };
      await this.evidenciaRepo.save(evidencia);
    }
  }
}
