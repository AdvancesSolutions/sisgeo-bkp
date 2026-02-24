import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fornecedor } from '../../entities/fornecedor.entity';
import { Insumo } from '../../entities/insumo.entity';
import { Estoque } from '../../entities/estoque.entity';
import { ConsumoRegistro } from '../../entities/consumo-registro.entity';
import { PedidoCompra } from '../../entities/pedido-compra.entity';
import { ChecklistItem } from '../../entities/checklist-item.entity';
import { SuprimentosController } from './suprimentos.controller';
import { SuprimentosService } from './suprimentos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Fornecedor,
      Insumo,
      Estoque,
      ConsumoRegistro,
      PedidoCompra,
      ChecklistItem,
    ]),
  ],
  controllers: [SuprimentosController],
  providers: [SuprimentosService],
  exports: [SuprimentosService],
})
export class SuprimentosModule {}
