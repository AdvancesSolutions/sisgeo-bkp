import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { EmployeeAccessService, type EmployeeAccessItem } from './employee-access.service';
import {
  createEmployeeAccessSchema,
  resetEmployeeAccessSchema,
} from '@sigeo/shared';

@ApiTags('employee-access')
@Controller('employee-access')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class EmployeeAccessController {
  constructor(private readonly service: EmployeeAccessService) {}

  @Get()
  @ApiOperation({ summary: 'Listar acessos dos funcionários' })
  async list(): Promise<{ data: EmployeeAccessItem[] }> {
    const data = await this.service.list();
    return { data };
  }

  @Post()
  @ApiOperation({ summary: 'Criar acesso para funcionário' })
  async create(@Body() body: unknown) {
    const dto = createEmployeeAccessSchema.parse(body);
    return this.service.create(dto);
  }

  @Patch(':employeeId/password')
  @ApiOperation({ summary: 'Redefinir senha do acesso' })
  async resetPassword(@Param('employeeId') employeeId: string, @Body() body: unknown) {
    const dto = resetEmployeeAccessSchema.parse(body);
    await this.service.resetPassword(employeeId, dto);
  }

  @Delete(':employeeId')
  @ApiOperation({ summary: 'Revogar acesso do funcionário' })
  async revoke(@Param('employeeId') employeeId: string) {
    await this.service.revoke(employeeId);
  }
}
