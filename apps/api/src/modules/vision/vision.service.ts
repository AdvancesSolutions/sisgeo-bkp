import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { VISION_QUEUE, type VisionJobData } from './vision.processor';
import { Evidencia } from '../../entities/evidencia.entity';
import { VisionAIService } from '../../services/visionAI.service';

@Injectable()
export class VisionService {
  constructor(
    @InjectQueue(VISION_QUEUE)
    private readonly queue: Queue,
    @InjectRepository(Evidencia)
    private readonly evidenciaRepo: Repository<Evidencia>,
    private readonly visionAI: VisionAIService,
  ) {}

  /**
   * Enfileira análise de foto (não bloqueia o checkout).
   * Cria evidência PENDING e adiciona job com evidenciaId + caminhoS3.
   */
  async enqueueAnalysis(taskPhotoId: string, caminhoS3: string): Promise<void> {
    try {
      const evidencia = this.evidenciaRepo.create({
        id: uuid(),
        taskPhotoId,
        limpo: null,
        confianca: 0,
        detalhes: null,
        anomaliaDetectada: false,
        status: 'PENDING',
        provider: 'OLLAMA',
        rawResponse: null,
      });
      await this.evidenciaRepo.save(evidencia);

      await this.queue.add(
        'analyze',
        { evidenciaId: evidencia.id, caminhoS3 } as VisionJobData,
        { attempts: 3, backoff: { type: 'custom' } },
      );
    } catch (e) {
      await this.fallbackSyncAnalysis(taskPhotoId, caminhoS3, e as Error);
    }
  }

  /**
   * Fallback: se Redis/queue indisponível, executa análise síncrona e salva
   */
  private async fallbackSyncAnalysis(
    taskPhotoId: string,
    caminhoS3: string,
    queueError: Error,
  ): Promise<void> {
    try {
      const result = await this.visionAI.analyzeWithOllama(caminhoS3);
      const evidencia = this.evidenciaRepo.create({
        id: uuid(),
        taskPhotoId,
        limpo: result.limpo,
        confianca: result.confianca,
        detalhes: result.detalhes,
        anomaliaDetectada: result.anomaliaDetectada,
        status: result.status,
        provider: 'OLLAMA',
        rawResponse: result.rawResponse ?? null,
      });
      await this.evidenciaRepo.save(evidencia);
    } catch {
      await this.evidenciaRepo.save(
        this.evidenciaRepo.create({
          id: uuid(),
          taskPhotoId,
          limpo: null,
          confianca: 0,
          detalhes: `Fila indisponível: ${queueError.message}. Aguardando revisão manual.`,
          anomaliaDetectada: false,
          status: 'AGUARDANDO_REVISAO_MANUAL',
          provider: 'OLLAMA',
          rawResponse: { queueError: queueError.message },
        }),
      );
    }
  }

  /** Estatísticas da fila para /admin/queue-status */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  }> {
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
      this.queue.isPaused(),
    ]);
    return { waiting, active, completed, failed, delayed, paused };
  }

  /** Retorna última evidência de uma foto (para alerta no mobile) */
  async getLastEvidencia(taskPhotoId: string): Promise<Evidencia | null> {
    return this.evidenciaRepo.findOne({
      where: { taskPhotoId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Lista evidências suspeitas (Dashboard de Auditoria) */
  async findSuspeitas(filters?: { taskId?: string }): Promise<Evidencia[]> {
    const qb = this.evidenciaRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.taskPhoto', 'p')
      .where('e.status IN (:...statuses)', {
        statuses: ['SUSPEITA', 'AGUARDANDO_REVISAO_MANUAL'],
      })
      .orderBy('e.created_at', 'DESC')
      .take(100);
    if (filters?.taskId) {
      qb.andWhere('p.task_id = :taskId', { taskId: filters.taskId });
    }
    return qb.getMany();
  }
}
