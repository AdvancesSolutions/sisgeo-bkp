import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { PublicFeedbackService } from './public-feedback.service';
import { UploadService } from '../upload/upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

const storage = memoryStorage();
const limit = 5 * 1024 * 1024; // 5MB

/** Rotas públicas - sem autenticação (acesso via QR Code) */
@ApiTags('public')
@Controller('public')
export class PublicFeedbackController {
  constructor(
    private readonly service: PublicFeedbackService,
    private readonly upload: UploadService,
  ) {}

  @Get('areas/:id')
  @ApiOperation({ summary: 'Info da área para formulário (QR Code)' })
  getArea(@Param('id') id: string) {
    return this.service.getAreaPublic(id);
  }

  @Post('feedback/upload-photo')
  @ApiOperation({ summary: 'Upload de foto anônima para feedback' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
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
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    const result = await this.upload.save(file, 'feedback/photos');
    return { url: result.url };
  }

  @Post('feedback')
  @ApiOperation({ summary: 'Enviar feedback público (avaliação + alerta)' })
  createFeedback(
    @Body()
    body: {
      areaId: string;
      rating: number;
      alertType?: string | null;
      photoUrl?: string | null;
    },
  ) {
    return this.service.create(body);
  }
}

/** Dashboard de reputação - autenticado */
@ApiTags('feedback')
@ApiBearerAuth()
@Controller('feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
export class FeedbackStatsController {
  constructor(private readonly service: PublicFeedbackService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Métricas de satisfação e SLA (Dashboard de Reputação)' })
  getStats(
    @Query('areaId') areaId?: string,
    @Query('since') since?: string,
  ) {
    const filters: { areaId?: string; since?: Date } = {};
    if (areaId) filters.areaId = areaId;
    if (since) filters.since = new Date(since);
    return this.service.getStats(filters);
  }
}
