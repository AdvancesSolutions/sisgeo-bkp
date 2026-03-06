import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { VisionModule } from '../vision/vision.module';

@Module({
  imports: [VisionModule],
  controllers: [AdminController],
})
export class AdminModule {}
