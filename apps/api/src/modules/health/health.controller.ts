import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  check() {
    return { status: 'ok' };
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
