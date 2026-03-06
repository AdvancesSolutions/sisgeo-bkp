import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { VisionService } from './vision.service';

@ApiTags('vision')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vision')
export class VisionController {
  constructor(private readonly vision: VisionService) {}

  @Get('evidencia/:taskPhotoId')
  @ApiOperation({ summary: 'Última evidência de análise IA para uma foto (mobile: alerta)' })
  getEvidencia(@Param('taskPhotoId') taskPhotoId: string) {
    return this.vision.getLastEvidencia(taskPhotoId);
  }

  @Get('evidencias/suspeitas')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Fotos suspeitas para Dashboard de Auditoria' })
  getSuspeitas(@Query('taskId') taskId?: string) {
    return this.vision.findSuspeitas({ taskId });
  }
}
