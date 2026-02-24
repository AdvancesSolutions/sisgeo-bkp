import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { IncidentsService } from './incidents.service';

@ApiTags('incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly service: IncidentsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Listar ocorrências' })
  findAll(@Query('status') status?: string) {
    return this.service.findAll({ status });
  }

  @Get('active-count')
  @ApiOperation({ summary: 'Contador de ocorrências ativas' })
  countActive() {
    return this.service.countActive();
  }

  @Post()
  @ApiOperation({ summary: 'Criar ocorrência (auxiliar em campo)' })
  create(
    @Body()
    body: {
      employeeId: string;
      type: string;
      description: string;
      organizationId?: string | null;
      areaId?: string | null;
    },
  ) {
    return this.service.create(body);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Atualizar status da ocorrência' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateStatus(id, body.status);
  }
}
