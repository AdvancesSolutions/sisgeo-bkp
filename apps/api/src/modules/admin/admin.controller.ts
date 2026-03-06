import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { VisionService } from '../vision/vision.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
@Controller('admin')
export class AdminController {
  constructor(private readonly vision: VisionService) {}

  @Get('queue-status')
  @ApiOperation({ summary: 'Status da fila de análise IA (fotos aguardando)' })
  getQueueStatus() {
    return this.vision.getQueueStats();
  }
}
