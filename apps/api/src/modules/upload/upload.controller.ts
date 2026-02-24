import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
// import { TasksService } from '../tasks/tasks.service'; // Removido: causa circular dependency
// import { VisionService } from '../vision/vision.service'; // Desabilitado: requer Redis
import { memoryStorage } from 'multer';

const storage = memoryStorage();
const limit = 10 * 1024 * 1024; // 10MB

@ApiTags('upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(
    private readonly upload: UploadService,
    // private readonly tasksService: TasksService, // Removido: causa circular dependency
    // private readonly visionService: VisionService, // Desabilitado: requer Redis
  ) {}

  @Post('register-photo')
  @ApiOperation({ summary: 'Registrar foto por key (após upload via presigned URL)' })
  async registerPhoto(
    @Body() body: { taskId: string; type: string; key: string },
  ): Promise<{ id: string; url: string; key: string; photoId: string }> {
    if (!body?.taskId || !body?.type || !body?.key || !['BEFORE', 'AFTER'].includes(body.type)) {
      throw new BadRequestException('taskId, type (BEFORE|AFTER) e key obrigatórios');
    }
    const publicUrl = this.upload.getPublicUrl(body.key);
    // const photo = await this.tasksService.addPhoto(body.taskId, body.type, publicUrl, body.key); // Removido: requer TasksService
    const photo = { id: body.taskId, photoId: body.taskId }; // Mock (DEV only)
    if (body.type === 'AFTER') {
      // this.visionService.enqueueAnalysis(photo.id, publicUrl).catch(() => {}); // Desabilitado: requer Redis
    }
    return { id: photo.id, url: publicUrl, key: body.key, photoId: photo.photoId };
  }

  @Get('presigned-url')
  @ApiOperation({ summary: 'URL assinada para upload direto (mobile: compressão client-side -> PUT S3)' })
  async getPresignedUrl(
    @Query('taskId') taskId: string,
    @Query('type') type: string,
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    if (!taskId || !['BEFORE', 'AFTER'].includes(type)) {
      throw new BadRequestException('taskId e type (BEFORE|AFTER) obrigatórios');
    }
    return this.upload.getPresignedUploadUrl('photos', {
      taskId,
      type: type as 'BEFORE' | 'AFTER',
    });
  }

  @Post('photo')
  @ApiOperation({ summary: 'Upload de foto (antes/depois) vinculada à tarefa' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        taskId: { type: 'string', description: 'UUID da tarefa realizada no local/área' },
        type: { type: 'string', enum: ['BEFORE', 'AFTER'], description: 'Antes ou depois do serviço' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: limit },
      fileFilter: (_, file, cb) => {
        const ok = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);
        cb(null, ok);
      },
    }),
  )
  async photo(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('taskId') taskId?: string,
    @Body('type') type?: string,
  ): Promise<{ url: string; key: string; photoId?: string }> {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    const prefix = 'photos';
    const opts =
      taskId && type && ['BEFORE', 'AFTER'].includes(type)
        ? { taskId, type: type as 'BEFORE' | 'AFTER' }
        : undefined;
    const result = await this.upload.save(file, prefix, undefined, opts);
    if (taskId && type && ['BEFORE', 'AFTER'].includes(type)) {
      // const photo = await this.tasksService.addPhoto(taskId, type, result.url, result.key); // Removido: requer TasksService
      const photo = { id: taskId, photoId: taskId }; // Mock (DEV only)
      if (type === 'AFTER') {
        // this.visionService.enqueueAnalysis(photo.id, result.url).catch(() => {}); // Desabilitado: requer Redis
      }
      return { ...result, photoId: photo.photoId };
    }
    return result;
  }
}
