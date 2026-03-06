import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuprimentosService } from './suprimentos.service';

@ApiTags('suprimentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suprimentos')
export class SuprimentosController {
  constructor(private readonly service: SuprimentosService) {}

  @Get('custo-por-setor')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Custo de insumos por setor (últimos 30 dias)' })
  getCustoPorSetor(
    @Query('locationId') locationId?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.service.getCustoPorSetor({ locationId, organizationId });
  }

  @Get('cotacao/:insumoId')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Smart Quote - cotação simulada de 3 fornecedores' })
  getCotacao(@Param('insumoId') insumoId: string) {
    return this.service.getCotacaoSimulada(insumoId);
  }

  @Get('predicao/:insumoId/:areaId')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Data prevista para estoque crítico' })
  getPredicao(
    @Param('insumoId') insumoId: string,
    @Param('areaId') areaId: string,
  ) {
    return this.service.preverDataEstoqueCritico(insumoId, areaId);
  }

  @Get('insumos')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Listar insumos' })
  listInsumos() {
    return this.service.listInsumos();
  }

  @Get('fornecedores')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Listar fornecedores' })
  listFornecedores() {
    return this.service.listFornecedores();
  }

  @Get('estoque')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Listar estoque por área' })
  listEstoque(@Query('areaId') areaId?: string) {
    return this.service.listEstoque(areaId);
  }

  @Get('pedidos')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Listar pedidos de compra' })
  listPedidos(@Query('status') status?: string) {
    return this.service.listPedidos(status);
  }

  @Get('estoques-criticos')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Listar estoques em nível crítico' })
  listEstoquesCriticos(@Query('areaId') areaId?: string) {
    return this.service.listEstoquesCriticos(areaId);
  }

  @Patch('pedidos/:id/aprovar')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Aprovar pedido em um clique' })
  aprovarPedido(@Param('id') id: string) {
    return this.service.aprovarPedido(id);
  }

  @Patch('pedidos/:id/receber')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Confirmar recebimento (NF/QR) e atualizar estoque' })
  confirmarRecebimento(
    @Param('id') id: string,
    @Body() body?: { nfCodigo?: string },
  ) {
    return this.service.confirmarRecebimento(id, body?.nfCodigo);
  }
}
