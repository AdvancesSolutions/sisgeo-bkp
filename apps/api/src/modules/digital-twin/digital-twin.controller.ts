import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DigitalTwinService } from './digital-twin.service';

@ApiTags('digital-twin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
@Controller('digital-twin')
export class DigitalTwinController {
  constructor(private readonly service: DigitalTwinService) {}

  @Get('status/:locationId')
  @ApiOperation({ summary: 'Status de higiene por setor para o mapa de calor' })
  getStatus(
    @Param('locationId') locationId: string,
    @Query('floor') floor?: number,
    @Query('includeAtivos') includeAtivos?: string,
    @Query('includeOccurrences') includeOccurrences?: string,
  ) {
    return this.service.getDigitalTwinStatus(locationId, {
      floorNumber: floor ?? 1,
      includeAtivos: includeAtivos === 'true',
      includeOccurrences: includeOccurrences !== 'false',
    });
  }

  @Get('hygiene/:locationId')
  @ApiOperation({ summary: 'Status de higiene por área (sem zonas)' })
  getHygiene(@Param('locationId') locationId: string) {
    return this.service.getHygieneStatusByLocation(locationId);
  }

  @Post('floor-plan/:locationId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        const ok = /^image\/(jpeg|png|webp|svg\+xml)$/i.test(file.mimetype) ||
          file.mimetype === 'image/svg+xml';
        cb(null, !!ok);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        floorNumber: { type: 'number', default: 1 },
      },
    },
  })
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Upload de planta baixa (SVG ou PNG)' })
  uploadFloorPlan(
    @Param('locationId') locationId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('floorNumber') floorNumber?: string,
  ) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    const floor = floorNumber ? parseInt(floorNumber, 10) : 1;
    return this.service.uploadFloorPlan(locationId, file, isNaN(floor) ? 1 : floor);
  }

  @Put('zones')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Salvar mapeamento área -> polígono na planta' })
  saveZone(
    @Body() body: { areaId: string; plantaBaixaId: string; polygon: { x: number; y: number }[] },
  ) {
    return this.service.saveZone(body.areaId, body.plantaBaixaId, body.polygon);
  }

  @Get('zones/:plantaBaixaId')
  @ApiOperation({ summary: 'Listar zonas de uma planta baixa' })
  getZones(@Param('plantaBaixaId') plantaBaixaId: string) {
    return this.service.getZones(plantaBaixaId);
  }

  @Delete('zones/:zoneId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remover zona' })
  removeZone(@Param('zoneId') zoneId: string) {
    return this.service.removeZone(zoneId);
  }
}
