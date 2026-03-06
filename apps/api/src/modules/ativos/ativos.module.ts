import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ativo } from '../../entities/ativo.entity';
import { AtivoManutencao } from '../../entities/ativo-manutencao.entity';
import { Task } from '../../entities/task.entity';
import { Area } from '../../entities/area.entity';
import { AtivosController } from './ativos.controller';
import { AtivosService } from './ativos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ativo, AtivoManutencao, Task, Area]),
  ],
  controllers: [AtivosController],
  providers: [AtivosService],
  exports: [AtivosService],
})
export class AtivosModule {}
