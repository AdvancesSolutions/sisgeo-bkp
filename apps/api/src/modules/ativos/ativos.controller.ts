import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AtivosService } from './ativos.service';

@ApiTags('ativos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ativos')
export class AtivosController {
  constructor(private readonly service: AtivosService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Cadastrar ativo/equipamento' })
  create(@Body() body: unknown) {
    return this.service.create(body as Parameters<AtivosService['create']>[0]);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ativos' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.service.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      { status, locationId },
    );
  }

  @Get('alertas')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Ativos próximos da revisão (≥90% do limite)' })
  getAlertas() {
    return this.service.getAlertasPreventivos();
  }

  @Get('qr/:qrCode')
  @ApiOperation({ summary: 'Buscar ativo por QR Code' })
  findByQr(@Param('qrCode') qrCode: string) {
    return this.service.findByQrCode(qrCode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar ativo por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Atualizar ativo' })
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.service.update(id, body as Record<string, unknown>);
  }

  @Post(':id/baixa-manutencao')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Dar baixa em manutenção (libera ativo)' })
  darBaixa(@Param('id') id: string, @Body() body?: { observacoes?: string }) {
    return this.service.darBaixaManutencao(id, body?.observacoes);
  }
}
