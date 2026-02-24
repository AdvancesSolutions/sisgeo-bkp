import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiVisionService } from './ai-vision.service';

@ApiTags('ai-vision')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-vision')
export class AiVisionController {
  constructor(private readonly service: AiVisionService) {}

  @Post('validate-photo')
  @ApiOperation({ summary: 'Valida foto de limpeza (Depois) via IA' })
  validatePhoto(@Body() body: { taskPhotoId: string; imageUrl: string }) {
    return this.service.validateCleaningPhoto(body.taskPhotoId, body.imageUrl);
  }

  @Get('result/:taskPhotoId')
  @ApiOperation({ summary: 'Último resultado de IA para uma foto' })
  getResult(@Param('taskPhotoId') taskPhotoId: string) {
    return this.service.getLastResult(taskPhotoId);
  }
}
