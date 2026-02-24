import { Module } from '@nestjs/common';
// import { TasksModule } from '../tasks/tasks.module'; // Removido: causa circular dependency
// import { VisionModule } from '../vision/vision.module'; // Desabilitado: requer Redis
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [], // Sem imports: TasksService será injetado via forwardRef ou em outro lugar
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
