import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiscoColaborador } from '../../entities/risco-colaborador.entity';
import { Employee } from '../../entities/employee.entity';
import { Task } from '../../entities/task.entity';
import { TimeClock } from '../../entities/time-clock.entity';
import { Evidencia } from '../../entities/evidencia.entity';
import { AiCheckResult } from '../../entities/ai-check-result.entity';
import { OcorrenciaEmergencial } from '../../entities/ocorrencia-emergencial.entity';
import { Location } from '../../entities/location.entity';
import { RiscoColaboradorController } from './risco-colaborador.controller';
import { RiscoColaboradorService } from './risco-colaborador.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RiscoColaborador,
      Employee,
      Task,
      TimeClock,
      Evidencia,
      AiCheckResult,
      OcorrenciaEmergencial,
      Location,
    ]),
  ],
  controllers: [RiscoColaboradorController],
  providers: [RiscoColaboradorService],
  exports: [RiscoColaboradorService],
})
export class RiscoColaboradorModule {}
