import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly ds: DataSource) {}

  @Get()
  check() {
    return { status: 'ok' };
  }

  /** Verifica conectividade com o banco (útil para diagnosticar 500). */
  @Get('db')
  async checkDb() {
    try {
      await this.ds.query('SELECT 1');
      return { db: 'ok' };
    } catch (e) {
      const err = e as Error;
      return {
        db: 'error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Database connection failed',
      };
    }
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
