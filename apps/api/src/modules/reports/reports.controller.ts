import { Controller, Get, Query, Param, UseGuards, StreamableFile, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReportsService } from './reports.service';

function parseDateRange(from?: string, to?: string) {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);
  if (from) fromDate.setTime(new Date(from).getTime());
  if (to) toDate.setTime(new Date(to).getTime());
  return { fromDate, toDate };
}

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('audit/pdf')
  @ApiOperation({ summary: 'Exportar relatório de auditoria em PDF' })
  @Header('Content-Disposition', 'attachment; filename=auditoria.pdf')
  async auditPdf(@Query('from') from?: string, @Query('to') to?: string) {
    const { fromDate, toDate } = parseDateRange(from, to);
    const buf = await this.service.generateAuditPdf(fromDate, toDate);
    return new StreamableFile(buf, { type: 'application/pdf' });
  }

  @Get('audit/excel')
  @ApiOperation({ summary: 'Exportar relatório de auditoria em Excel' })
  @Header('Content-Disposition', 'attachment; filename=auditoria.xlsx')
  async auditExcel(@Query('from') from?: string, @Query('to') to?: string) {
    const { fromDate, toDate } = parseDateRange(from, to);
    const buf = await this.service.generateAuditExcel(fromDate, toDate);
    return new StreamableFile(buf, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  @Get('productivity/pdf')
  @ApiOperation({ summary: 'Exportar relatório de produtividade em PDF' })
  @Header('Content-Disposition', 'attachment; filename=produtividade.pdf')
  async productivityPdf(@Query('from') from?: string, @Query('to') to?: string) {
    const { fromDate, toDate } = parseDateRange(from, to);
    const buf = await this.service.generateProductivityPdf(fromDate, toDate);
    return new StreamableFile(buf, { type: 'application/pdf' });
  }

  @Get('productivity/excel')
  @ApiOperation({ summary: 'Exportar relatório de produtividade em Excel' })
  @Header('Content-Disposition', 'attachment; filename=produtividade.xlsx')
  async productivityExcel(@Query('from') from?: string, @Query('to') to?: string) {
    const { fromDate, toDate } = parseDateRange(from, to);
    const buf = await this.service.generateProductivityExcel(fromDate, toDate);
    return new StreamableFile(buf, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  @Get('visit/:taskId/pdf')
  @ApiOperation({ summary: 'Relatório de Visita Digital (PDF com fotos, geolocalização e tempo de permanência)' })
  @Header('Content-Disposition', 'attachment; filename=relatorio-visita.pdf')
  async visitPdf(@Param('taskId') taskId: string) {
    const buf = await this.service.generateVisitReportPdf(taskId);
    return new StreamableFile(buf, { type: 'application/pdf' });
  }

  @Get('daily/pdf')
  @ApiOperation({ summary: 'PDF consolidado do dia (tarefas, fotos, evidências)' })
  @Header('Content-Disposition', 'attachment; filename=relatorio-diario.pdf')
  async dailyPdf(@Query('date') date?: string) {
    const d = date ? new Date(date) : new Date();
    const buf = await this.service.generateDailyPdf(d);
    return new StreamableFile(buf, { type: 'application/pdf' });
  }
}
