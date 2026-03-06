import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { CleaningTypesService } from './cleaning-types.service';
import { cleaningTypeSchema, cleaningTypeUpdateSchema } from '@sigeo/shared';
import type { CleaningTypeInput, CleaningTypeUpdateInput } from '@sigeo/shared';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('cleaning-types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
@Controller('cleaning-types')
export class CleaningTypesController {
  constructor(private readonly service: CleaningTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar tipo de limpeza' })
  create(@Body() body: unknown) {
    return this.service.create(cleaningTypeSchema.parse(body) as CleaningTypeInput);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tipos de limpeza' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar tipo de limpeza' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.service.update(id, cleaningTypeUpdateSchema.parse(body) as CleaningTypeUpdateInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover tipo de limpeza' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
  }
}
