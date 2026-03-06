import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';
import { EsgService } from './esg.service';
import { GamificationService } from './gamification.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly service: DashboardService,
    private readonly esgService: EsgService,
    private readonly gamificationService: GamificationService,
  ) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs do dashboard (Conformidade, SLA, Ocorrências, Cobertura)' })
  getKpis(@Query('date') date?: string) {
    const d = date ? new Date(date) : new Date();
    return this.service.getKpis(d);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Tarefas do dia para monitoramento live' })
  getTasksLive(
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('areaId') areaId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('riskClassification') riskClassification?: string,
  ) {
    const d = date ? new Date(date) : new Date();
    return this.service.getTasksLive(d, {
      status,
      areaId,
      employeeId,
      riskClassification,
    });
  }

  @Get('performance')
  @ApiOperation({ summary: 'Evolução de performance (FindMe Score) por período' })
  getPerformanceEvolution(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('granularity') granularity?: 'day' | 'week' | 'month',
    @Query('organizationId') organizationId?: string,
    @Query('locationId') locationId?: string,
    @Query('areaId') areaId?: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    return this.service.getPerformanceEvolution(fromDate, toDate, granularity ?? 'day', {
      organizationId,
      locationId,
      areaId,
    });
  }

  @Get('ranking')
  @ApiOperation({ summary: 'Ranking de eficiência por setor/unidade/cliente' })
  getRanking(
    @Query('date') date?: string,
    @Query('groupBy') groupBy?: 'area' | 'location' | 'organization',
    @Query('organizationId') organizationId?: string,
    @Query('locationId') locationId?: string,
  ) {
    const d = date ? new Date(date) : new Date();
    return this.service.getRanking(d, groupBy ?? 'location', {
      organizationId,
      locationId,
    });
  }

  @Get('findme-score/calculate')
  @ApiOperation({ summary: 'Calcula e persiste FindMe Score para uma data' })
  calculateFindMeScore(
    @Query('date') date?: string,
    @Query('organizationId') organizationId?: string,
    @Query('locationId') locationId?: string,
  ) {
    const d = date ? new Date(date) : new Date();
    return this.service.calculateFindMeScore(d, { organizationId, locationId });
  }

  @Get('esg')
  @ApiOperation({ summary: 'Métricas de impacto ESG (pegada hídrica, resíduos)' })
  getEsgMetrics(@Query('organizationId') organizationId?: string) {
    return this.esgService.getImpactMetrics(organizationId);
  }

  @Get('gamification')
  @ApiOperation({ summary: 'Ranking de gamificação (medalhas, pontos)' })
  getGamificationRanking(
    @Query('periodo') periodo?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const p = periodo ?? new Date().toISOString().slice(0, 7);
    return this.gamificationService.getRanking(p, organizationId);
  }
}
