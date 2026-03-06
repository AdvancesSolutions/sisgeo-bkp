import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import * as express from 'express';
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
  @Roles('ADMIN', 'SUPERVISOR', 'AUXILIAR')
  @ApiOperation({ summary: 'Atualizar tarefa (AUXILIAR: status e coordenadas de check-in/out)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @CurrentUser() user?: { sub: string; role: string; employeeId?: string | null },
    @Req() req?: express.Request,
  ) {
    const ctx = req ? { ip: req.ip ?? req.socket?.remoteAddress, userAgent: req.headers['user-agent'] } : undefined;
    return this.service.update(id, body as TaskUpdateInput, user?.sub, ctx, user);
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Aprovar tarefa (DONE)' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Req() req?: express.Request,
  ) {
    const ctx = req ? { ip: req.ip ?? req.socket?.remoteAddress, userAgent: req.headers['user-agent'] } : undefined;
    return this.service.approve(id, userId, ctx);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Recusar tarefa (volta IN_PROGRESS)' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Body() body: unknown,
    @Req() req?: express.Request,
  ) {
    const ctx = req ? { ip: req.ip ?? req.socket?.remoteAddress, userAgent: req.headers['user-agent'] } : undefined;
    return this.service.reject(id, userId, rejectTaskSchema.parse(body) as RejectTaskInput, ctx);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Remover tarefa' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId?: string,
    @Req() req?: express.Request,
  ) {
    const ctx = req ? { ip: req.ip ?? req.socket?.remoteAddress, userAgent: req.headers['user-agent'] } : undefined;
    await this.service.remove(id, userId, ctx);
  }
}
