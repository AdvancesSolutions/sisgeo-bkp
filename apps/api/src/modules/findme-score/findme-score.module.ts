import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Area } from '../../entities/area.entity';
import { Task } from '../../entities/task.entity';
import { Incident } from '../../entities/incident.entity';
import { ScoreDiario } from '../../entities/score-diario.entity';
import { Organization } from '../../entities/organization.entity';
import { Region } from '../../entities/region.entity';
import { OcorrenciaEmergencial } from '../../entities/ocorrencia-emergencial.entity';
import { TrocaTurno } from '../../entities/troca-turno.entity';
import { TrocaTurnoFoto } from '../../entities/troca-turno-foto.entity';
import { FindMeScoreService } from './findme-score.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Area,
      Task,
      Incident,
      ScoreDiario,
      Organization,
      Region,
      OcorrenciaEmergencial,
      TrocaTurno,
      TrocaTurnoFoto,
    ]),
  ],
  providers: [FindMeScoreService],
  exports: [FindMeScoreService],
})
export class FindMeScoreModule {}
