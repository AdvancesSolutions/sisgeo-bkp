import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Procedimento } from '../../entities/procedimento.entity';
import { ColaboradorTreinamento } from '../../entities/colaborador-treinamento.entity';
import { Task } from '../../entities/task.entity';
import { ProcedimentosService } from './procedimentos.service';
import { ProcedimentosController } from './procedimentos.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Procedimento, ColaboradorTreinamento, Task]),
    UploadModule,
  ],
  controllers: [ProcedimentosController],
  providers: [ProcedimentosService],
  exports: [ProcedimentosService],
})
export class ProcedimentosModule {}
