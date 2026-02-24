import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../../entities/task.entity';
import { TaskPhoto } from '../../entities/task-photo.entity';
import { Area } from '../../entities/area.entity';
import { Employee } from '../../entities/employee.entity';
import { Ativo } from '../../entities/ativo.entity';
import { SlaAlert } from '../../entities/sla-alert.entity';
import { AuditModule } from '../audit/audit.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksSchedulerService } from './tasks-scheduler.service';
import { SlaAlertsService } from './sla-alerts.service';
import { AtivosModule } from '../ativos/ativos.module';
import { ProcedimentosModule } from '../procedimentos/procedimentos.module';
import { DigitalTwinModule } from '../digital-twin/digital-twin.module';
import { SuprimentosModule } from '../suprimentos/suprimentos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskPhoto, Area, Employee, Ativo, SlaAlert]),
    AuditModule,
    AtivosModule,
    ProcedimentosModule,
    DigitalTwinModule,
    SuprimentosModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksSchedulerService, SlaAlertsService],
  exports: [TasksService],
})
export class TasksModule {}
