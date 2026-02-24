import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RiscoColaboradorService } from './risco-colaborador.service';

@ApiTags('risco-colaborador')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
@Controller('risco-colaborador')
export class RiscoColaboradorController {
  constructor(private readonly service: RiscoColaboradorService) {}

  @Get()
  @ApiOperation({ summary: 'Lista colaboradores com risco de evasão (Dashboard Retenção)' })
  listar(
    @Query('referenceDate') referenceDate?: string,
    @Query('organizationId') organizationId?: string,
    @Query('locationId') locationId?: string,
    @Query('nivel') nivel?: string,
  ) {
    const ref = referenceDate ? new Date(referenceDate) : new Date();
    return this.service.listar(ref, { organizationId, locationId, nivel });
  }

  @Get('roi')
  @ApiOperation({ summary: 'Relatório de economia (Custo de Turnover Evitado)' })
  getRoi(
    @Query('organizationId') organizationId?: string,
    @Query('locationId') locationId?: string
  ) {
    return this.service.getRoiEconomia({ organizationId, locationId });
  }

  @Get('processar')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Forçar processamento do worker (manual)' })
  async processar() {
    const count = await this.service.calcularEPersistir(new Date());
    return { processados: count };
  }
}
