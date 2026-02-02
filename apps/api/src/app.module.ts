import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(getDbConfig()),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    AuditModule,
    EmployeesModule,
    LocationsModule,
    AreasModule,
    TasksModule,
    MaterialsModule,
    TimeClockModule,
    UploadModule,
    HealthModule,
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
