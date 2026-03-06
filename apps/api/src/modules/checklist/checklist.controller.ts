import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ChecklistService } from './checklist.service';
import {
  checklistItemSchema,
  checklistItemUpdateSchema,
  taskChecklistResponseSchema,
} from '@sigeo/shared';
import type {
  ChecklistItemInput,
  ChecklistItemUpdateInput,
  TaskChecklistResponseInput,
} from '@sigeo/shared';

@ApiTags('checklist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checklist')
export class ChecklistController {
  constructor(private readonly service: ChecklistService) {}

  /** Itens do checklist para uma tarefa (usado pelo mobile). */
  @Get('task/:taskId/items')
  @ApiOperation({ summary: 'Itens do checklist da tarefa (baseado no tipo de limpeza da área)' })
  getItemsByTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.service.findItemsByTaskId(taskId);
  }

  /** Respostas já salvas do checklist da tarefa. */
  @Get('task/:taskId/responses')
  @ApiOperation({ summary: 'Respostas do checklist da tarefa' })
  getResponsesByTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.service.findResponsesByTaskId(taskId);
  }

  /** Salvar respostas do checklist (mobile - auxiliar). */
  @Post('task/:taskId/responses')
  @ApiOperation({ summary: 'Salvar respostas do checklist' })
  saveResponses(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() body: { responses: TaskChecklistResponseInput[] },
  ) {
    return this.service.saveResponses(taskId, body.responses ?? []);
  }

  @Get('cleaning-type/:id/items')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Itens do checklist por tipo de limpeza' })
  getItemsByCleaningType(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findItemsByCleaningType(id);
  }

  @Post('items')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Criar item de checklist' })
  createItem(@Body() body: unknown) {
    return this.service.createItem(checklistItemSchema.parse(body) as ChecklistItemInput);
  }

  @Patch('items/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Atualizar item de checklist' })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.service.updateItem(id, checklistItemUpdateSchema.parse(body) as ChecklistItemUpdateInput);
  }

  @Delete('items/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Remover item de checklist' })
  async removeItem(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.removeItem(id);
  }
}
