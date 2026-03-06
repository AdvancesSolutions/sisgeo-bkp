import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../../entities/task.entity';
import { Incident } from '../../entities/incident.entity';
import { Area } from '../../entities/area.entity';
import { ProdutoQuimico } from '../../entities/produto-quimico.entity';
import { EstoqueMovimentacao } from '../../entities/estoque-movimentacao.entity';
import { EmployeeMedalha } from '../../entities/employee-medalha.entity';
import { EmployeePontos } from '../../entities/employee-pontos.entity';
import { Employee } from '../../entities/employee.entity';
import { ScoreDiario } from '../../entities/score-diario.entity';
import { Organization } from '../../entities/organization.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { EsgService } from './esg.service';
import { GamificationService } from './gamification.service';
import { FindMeScoreModule } from '../findme-score/findme-score.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      Incident,
      Area,
      ProdutoQuimico,
      EstoqueMovimentacao,
      EmployeeMedalha,
      EmployeePontos,
      Employee,
      ScoreDiario,
      Organization,
    ]),
    FindMeScoreModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService, EsgService, GamificationService],
  exports: [DashboardService],
})
export class DashboardModule {}
