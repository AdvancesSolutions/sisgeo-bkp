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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TasksService } from './tasks.service';
import { taskSchema, rejectTaskSchema } from '@sigeo/shared';
import type { TaskInput, TaskUpdateInput, RejectTaskInput } from '@sigeo/shared';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Criar tarefa' })
  create(@Body() body: unknown) {
    return this.service.create(taskSchema.parse(body) as TaskInput);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tarefas' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.service.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      { status, employeeId },
    );
  }

  @Get('validation/queue')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Fila de validação (IN_REVIEW)' })
  findValidationQueue() {
    return this.service.findValidationQueue();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar por ID (com fotos)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneWithPhotos(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Atualizar tarefa' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @CurrentUser('sub') userId?: string,
  ) {
    return this.service.update(id, body as TaskUpdateInput, userId);
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Aprovar tarefa (DONE)' })
  approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('sub') userId: string) {
    return this.service.approve(id, userId);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Recusar tarefa (volta IN_PROGRESS)' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Body() body: unknown,
  ) {
    return this.service.reject(id, userId, rejectTaskSchema.parse(body) as RejectTaskInput);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Remover tarefa' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('sub') userId?: string) {
    await this.service.remove(id, userId);
  }
}
