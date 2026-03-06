import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicFeedback } from '../../entities/public-feedback.entity';
import { Area } from '../../entities/area.entity';
import { Task } from '../../entities/task.entity';
import { PublicFeedbackController, FeedbackStatsController } from './public-feedback.controller';
import { PublicFeedbackService } from './public-feedback.service';
import { TasksModule } from '../tasks/tasks.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PublicFeedback, Area, Task]),
    TasksModule,
    UploadModule,
  ],
  controllers: [PublicFeedbackController, FeedbackStatsController],
  providers: [PublicFeedbackService],
  exports: [PublicFeedbackService],
})
export class PublicFeedbackModule {}
