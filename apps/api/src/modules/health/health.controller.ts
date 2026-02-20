import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly ds: DataSource) {}

  /** Health + verificação de banco (útil para diagnosticar 500 em /tasks). */
  @Get()
  async check() {
    let db: 'ok' | 'error' = 'ok';
    let dbMessage: string | undefined;
    try {
      await this.ds.query('SELECT 1');
    } catch (e) {
      db = 'error';
      dbMessage = process.env.NODE_ENV === 'development' ? (e as Error).message : 'Database connection failed';
    }
    return { status: 'ok', db, ...(dbMessage && { dbMessage }) };
  }

  /** Endpoint para verificar versão em produção (inclui employee-access). */
  @Get('version')
  version() {
    return {
      build: process.env.BUILD_DATE ?? 'dev',
      hasEmployeeAccess: true,
    };
  }

  /**
   * Política de atualização OTA do app mobile.
   * Retorna minRuntimeVersion, forceUpdate e message para update crítico.
   */
  @Get('app-config')
  appConfig() {
    return {
      minRuntimeVersion: '1.0.0',
      forceUpdate: false,
      message: 'Atualização obrigatória disponível.',
    };
  }
}
