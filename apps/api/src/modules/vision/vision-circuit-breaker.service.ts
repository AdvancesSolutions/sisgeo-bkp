import { Injectable } from '@nestjs/common';

const CIRCUIT_OPEN_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Circuit Breaker para Ollama: se falhar consistentemente por 5 min,
 * marca jobs como Revisão Manual em vez de retentar.
 */
@Injectable()
export class VisionCircuitBreakerService {
  private lastSuccessAt = 0;

  recordSuccess(): void {
    this.lastSuccessAt = Date.now();
  }

  /** Circuit abre apenas se já houve sucesso antes e falhamos por 5+ min */
  isCircuitOpen(): boolean {
    if (this.lastSuccessAt === 0) return false;
    return Date.now() - this.lastSuccessAt > CIRCUIT_OPEN_THRESHOLD_MS;
  }
}
