import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiCheckResult } from '../../entities/ai-check-result.entity';
import { TaskPhoto } from '../../entities/task-photo.entity';
import { AiVisionController } from './ai-vision.controller';
import { AiVisionService } from './ai-vision.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiCheckResult, TaskPhoto])],
  controllers: [AiVisionController],
  providers: [AiVisionService],
  exports: [AiVisionService],
})
export class AiVisionModule {}
