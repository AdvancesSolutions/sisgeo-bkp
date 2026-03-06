import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { getDbConfig } from './config/database';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { LocationsModule } from './modules/locations/locations.module';
import { AreasModule } from './modules/areas/areas.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { TimeClockModule } from './modules/time-clock/time-clock.module';
import { UploadModule } from './modules/upload/upload.module';
import { HealthModule } from './modules/health/health.module';
import { EmployeeAccessModule } from './modules/employee-access/employee-access.module';
import { CleaningTypesModule } from './modules/cleaning-types/cleaning-types.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ChecklistModule } from './modules/checklist/checklist.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { AiVisionModule } from './modules/ai-vision/ai-vision.module';
import { AtivosModule } from './modules/ativos/ativos.module';
import { VisionModule } from './modules/vision/vision.module';
import { AdminModule } from './modules/admin/admin.module';
import { ProcedimentosModule } from './modules/procedimentos/procedimentos.module';
import { VoiceModule } from './modules/voice/voice.module';
import { PublicFeedbackModule } from './modules/public-feedback/public-feedback.module';
import { RiscoColaboradorModule } from './modules/risco-colaborador/risco-colaborador.module';
import { DigitalTwinModule } from './modules/digital-twin/digital-twin.module';
import { SuprimentosModule } from './modules/suprimentos/suprimentos.module';
import { UsersModule } from './modules/users/users.module';
import { BullModule } from '@nestjs/bullmq';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

/** Conexão Redis com lazyConnect para não derrubar a API se Redis estiver indisponível (ex.: ECS sem ElastiCache). */
const bullConnection = {
  url: redisUrl,
  lazyConnect: true,
  maxRetriesPerRequest: null,
  retryStrategy: () => null,
};

/** API SIGEO - EmployeeAccessModule em produção */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot(getDbConfig()),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    BullModule.forRoot({
      connection: bullConnection,
    }),
    AuthModule,
    AuditModule,
    EmployeesModule,
    LocationsModule,
    AreasModule,
    TasksModule,
    MaterialsModule,
    CleaningTypesModule,
    TimeClockModule,
    UploadModule,
    HealthModule,
    EmployeeAccessModule,
    ReportsModule,
    ChecklistModule,
    DashboardModule,
    IncidentsModule,
    AiVisionModule,
    AtivosModule,
    VisionModule,
    AdminModule,
    ProcedimentosModule,
    VoiceModule,
    PublicFeedbackModule,
    RiscoColaboradorModule,
    DigitalTwinModule,
    SuprimentosModule,
    UsersModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
