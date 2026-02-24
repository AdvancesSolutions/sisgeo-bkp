import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeClock } from '../../entities/time-clock.entity';
import { Employee } from '../../entities/employee.entity';
import { Location } from '../../entities/location.entity';
import { Area } from '../../entities/area.entity';
import { TimeClockController } from './time-clock.controller';
import { TimeClockService } from './time-clock.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimeClock, Employee, Location, Area]),
    UploadModule,
  ],
  controllers: [TimeClockController],
  providers: [TimeClockService],
  exports: [TimeClockService],
})
export class TimeClockModule {}
