import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProcedimentosService } from './procedimentos.service';
import { UploadService } from '../upload/upload.service';
import { memoryStorage } from 'multer';

const storage = memoryStorage();
const VIDEO_LIMIT = 50 * 1024 * 1024; // 50MB
const PDF_LIMIT = 10 * 1024 * 1024; // 10MB
const THUMB_LIMIT = 5 * 1024 * 1024; // 5MB

@ApiTags('procedimentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('procedimentos')
export class ProcedimentosController {
  constructor(
    private readonly service: ProcedimentosService,
    private readonly upload: UploadService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar procedimentos (filtro por área ou tipo de limpeza)' })
  findAll(
    @Query('areaId') areaId?: string,
    @Query('cleaningTypeId') cleaningTypeId?: string,
  ) {
    return this.service.findAll({ areaId, cleaningTypeId });
  }

  @Get('area/:areaId/required')
  @ApiOperation({ summary: 'Procedimentos obrigatórios da área (primeira vez no setor)' })
  findRequiredByArea(@Param('areaId', ParseUUIDPipe) areaId: string) {
    return this.service.findRequiredByArea(areaId);
  }

  @Get('cleaning-type/:id')
  @ApiOperation({ summary: 'Procedimentos por tipo de limpeza (checklist)' })
  findByCleaningType(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findByCleaningType(id);
  }

  @Get('check-in-allowed/:taskId')
  @ApiOperation({ summary: 'Verifica se check-in é permitido (primeira vez exige assistir vídeo)' })
  async checkInAllowed(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user?: { employeeId?: string | null },
  ) {
    const task = await this.service.getTaskForCheckIn(taskId);
    if (!task) throw new BadRequestException('Tarefa não encontrada');
    if (!user?.employeeId || task.employeeId !== user.employeeId) {
      throw new BadRequestException('Tarefa não atribuída a você');
    }
    const isFirst = await this.service.isFirstTimeInArea(user.employeeId, task.areaId!);
    if (!isFirst) return { allowed: true, reason: 'Já atuou nesta área' };
    const hasWatched = await this.service.hasWatchedRequiredProcedimento(user.employeeId, task.areaId!);
    return {
      allowed: hasWatched,
      reason: hasWatched ? 'Treinamento concluído' : 'Assista ao vídeo de treinamento antes do check-in',
      procedimentos: hasWatched ? [] : await this.service.findRequiredByArea(task.areaId!),
    };
  }

  @Post('watched')
  @ApiOperation({ summary: 'Registrar que colaborador assistiu ao procedimento (mobile)' })
  logWatched(
    @Body() body: { procedimentoId: string; percentualAssistido?: number },
    @CurrentUser() user?: { employeeId?: string | null },
  ) {
    if (!user?.employeeId) throw new BadRequestException('Colaborador não identificado');
    return this.service.logWatched(
      user.employeeId,
      body.procedimentoId,
      body.percentualAssistido ?? 100,
    );
  }

  @Get('nivel-especializacao')
  @ApiOperation({ summary: 'Nível de especialização do colaborador (procedimentos assistidos)' })
  getNivelEspecializacao(@CurrentUser() user?: { employeeId?: string | null }) {
    if (!user?.employeeId) throw new BadRequestException('Colaborador não identificado');
    return this.service.getNivelEspecializacao(user.employeeId);
  }

  @Get('dashboard/correlacao')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Correlação: vídeos assistidos vs notas IA' })
  getCorrelacao() {
    return this.service.getCorrelacaoTreinamentoVsNotas();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Criar procedimento' })
  create(@Body() body: unknown) {
    return this.service.create(body as Parameters<ProcedimentosService['create']>[0]);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar procedimento por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Atualizar procedimento' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.service.update(id, body as Partial<Parameters<ProcedimentosService['create']>[0]>);
  }

  @Post(':id/upload/video')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: VIDEO_LIMIT },
      fileFilter: (_, file, cb) => {
        const ok = /^video\/(mp4|webm|quicktime)$/i.test(file.mimetype);
        cb(null, ok);
      },
    }),
  )
  async uploadVideo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('Arquivo de vídeo obrigatório');
    await this.service.findOne(id);
    const { url } = await this.upload.saveProcedureAsset(file, 'video', id);
    await this.service.update(id, { videoUrlS3: url });
    return { url };
  }

  @Post(':id/upload/pdf')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: PDF_LIMIT },
      fileFilter: (_, file, cb) => {
        const ok = file.mimetype === 'application/pdf';
        cb(null, ok);
      },
    }),
  )
  async uploadPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('Arquivo PDF obrigatório');
    await this.service.findOne(id);
    const { url } = await this.upload.saveProcedureAsset(file, 'pdf', id);
    await this.service.update(id, { manualPdfUrl: url });
    return { url };
  }

  @Post(':id/upload/thumbnail')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: THUMB_LIMIT },
      fileFilter: (_, file, cb) => {
        const ok = /^image\/(jpeg|png|webp)$/i.test(file.mimetype);
        cb(null, ok);
      },
    }),
  )
  async uploadThumbnail(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('Imagem obrigatória');
    await this.service.findOne(id);
    const { url } = await this.upload.saveProcedureAsset(file, 'thumbnail', id);
    await this.service.update(id, { thumbnailUrl: url });
    return { url };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Remover procedimento' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.delete(id);
  }
}
