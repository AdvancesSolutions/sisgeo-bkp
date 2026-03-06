import { Injectable, Logger, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Task } from '../../entities/task.entity';
import { TaskPhoto } from '../../entities/task-photo.entity';
import { Area } from '../../entities/area.entity';
import { Employee } from '../../entities/employee.entity';
import { Ativo } from '../../entities/ativo.entity';
import { taskSchema, taskUpdateSchema, rejectTaskSchema } from '@sigeo/shared';
import type { TaskInput, TaskUpdateInput, RejectTaskInput } from '@sigeo/shared';
import { AuditService, type RequestContext } from '../audit/audit.service';
import { AtivosService } from '../ativos/ativos.service';
import { ProcedimentosService } from '../procedimentos/procedimentos.service';
import { DigitalTwinGateway } from '../digital-twin/digital-twin.gateway';
import { SuprimentosService } from '../suprimentos/suprimentos.service';

type UpdateUser = { sub: string; role: string; employeeId?: string | null } | undefined;

/** Mínimo de fotos por tipo para enviar tarefa para validação (IN_REVIEW). Regra T5/F4. */
const MIN_PHOTOS_BEFORE = 1;
const MIN_PHOTOS_AFTER = 1;

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
    @InjectRepository(TaskPhoto)
    private readonly photoRepo: Repository<TaskPhoto>,
    @InjectRepository(Area)
    private readonly areaRepo: Repository<Area>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Ativo)
    private readonly ativoRepo: Repository<Ativo>,
    private readonly audit: AuditService,
    private readonly ativosService: AtivosService,
    private readonly procedimentos: ProcedimentosService,
    @Optional() private readonly digitalTwinGateway?: DigitalTwinGateway,
    @Optional() private readonly suprimentos?: SuprimentosService,
  ) {}

  async create(dto: TaskInput): Promise<Task> {
    const data = taskSchema.parse(dto);
    await this.validateAreaExists(data.areaId);
    if (data.employeeId) {
      await this.validateEmployeeActive(data.employeeId);
      await this.validateNoScheduleOverlap(data.employeeId, data.scheduledDate, data.scheduledTime, data.estimatedMinutes, null);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (data.scheduledDate < today) {
      throw new BadRequestException('Data agendada não pode ser no passado');
    }
    const e = this.repo.create({ id: uuid(), ...data });
    return this.repo.save(e);
  }

  private async validateAreaExists(areaId: string): Promise<void> {
    const area = await this.areaRepo.findOne({ where: { id: areaId } });
    if (!area) throw new BadRequestException('Área não encontrada');
  }

  /** Motor de Escalas: impede sobreposição de horários para o mesmo funcionário no mesmo dia. */
  private async validateNoScheduleOverlap(
    employeeId: string,
    scheduledDate: Date | string,
    scheduledTime: string | null | undefined,
    estimatedMinutes: number | null | undefined,
    excludeTaskId: string | null,
  ): Promise<void> {
    const date = typeof scheduledDate === 'string' ? new Date(scheduledDate) : scheduledDate;
    const dateStr = date.toISOString().slice(0, 10);

    const existing = await this.repo.find({
      where: { employeeId, scheduledDate: date },
    });

    const exclude = new Set(excludeTaskId ? [excludeTaskId] : []);
    const others = existing.filter((t) => !exclude.has(t.id));
    if (others.length === 0) return;

    const parseTime = (t: string | null | undefined): number => {
      if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return 0;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const getDuration = (task: Task, defaultMin: number) => task.estimatedMinutes ?? defaultMin;
    const MIN_PER_DAY = 24 * 60;

    const newStart = parseTime(scheduledTime);
    const newDuration = estimatedMinutes ?? (scheduledTime ? 60 : MIN_PER_DAY);
    const newEnd = newStart + newDuration;

    for (const other of others) {
      const oStart = parseTime(other.scheduledTime);
      const oDuration = getDuration(other, other.scheduledTime ? 60 : MIN_PER_DAY);
      const oEnd = oStart + oDuration;
      if (newStart < oEnd && newEnd > oStart) {
        throw new BadRequestException(
          `Horário sobrepõe outra tarefa do funcionário no mesmo dia (${dateStr}). Ajuste o horário ou a tarefa existente.`,
        );
      }
    }
  }

  /** Regra T7: funcionário atribuído à tarefa deve existir e estar ACTIVE. */
  private async validateEmployeeActive(employeeId: string): Promise<void> {
    const emp = await this.employeeRepo.findOne({ where: { id: employeeId } });
    if (!emp) throw new BadRequestException('Funcionário não encontrado');
    if (emp.status !== 'ACTIVE') {
      throw new BadRequestException('Só é possível atribuir tarefa a funcionário com status ACTIVE');
    }
  }

  async findAll(
    page = 1,
    limit = 50,
    filters?: { status?: string; employeeId?: string },
  ): Promise<{ data: Task[]; total: number; totalPages: number }> {
    const qb = this.repo.createQueryBuilder('t');
    if (filters?.status) qb.andWhere('t.status = :status', { status: filters.status });
    if (filters?.employeeId) qb.andWhere('t.employee_id = :employeeId', { employeeId: filters.employeeId });
    qb.orderBy('t.scheduled_date', 'DESC').addOrderBy('t.created_at', 'DESC');
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 1;
    return { data, total, totalPages };
  }

  async findOne(id: string): Promise<Task> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Tarefa não encontrada');
    return e;
  }

  async findOneWithPhotos(id: string): Promise<Task & { photos?: TaskPhoto[]; area?: Area }> {
    try {
      let task = await this.repo.findOne({
        where: { id },
        relations: ['area', 'employee'],
      });
      if (!task) throw new NotFoundException('Tarefa não encontrada');
      const photos = await this.photoRepo
        .createQueryBuilder('p')
        .where('p.task_id = :taskId', { taskId: id })
        .orderBy('p.type', 'ASC')
        .addOrderBy('p.created_at', 'DESC')
        .getMany();
      return { ...task, photos };
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      this.logger.warn(`findOneWithPhotos(${id}) relations failed, fallback without relations: ${(e as Error)?.message}`);
      const task = await this.repo.findOne({ where: { id } });
      if (!task) throw new NotFoundException('Tarefa não encontrada');
      const [area, employee, photos] = await Promise.all([
        task.areaId ? this.areaRepo.findOne({ where: { id: task.areaId }, select: ['id', 'name'] }).catch(() => null) : Promise.resolve(null),
        task.employeeId ? this.employeeRepo.findOne({ where: { id: task.employeeId }, select: ['id', 'name'] }).catch(() => null) : Promise.resolve(null),
        this.photoRepo.find({ where: { taskId: id }, order: { type: 'ASC', createdAt: 'DESC' } }),
      ]);
      return { ...task, area: area ?? undefined, employee: employee ?? undefined, photos };
    }
  }

  async getPhotos(taskId: string): Promise<TaskPhoto[]> {
    return this.photoRepo.find({ where: { taskId }, order: { type: 'ASC', createdAt: 'DESC' } });
  }

  async addPhoto(taskId: string, type: string, url: string, key: string): Promise<TaskPhoto> {
    const task = await this.findOne(taskId);
    if (task.status !== 'PENDING' && task.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Só é possível adicionar foto em tarefa com status PENDING ou IN_PROGRESS');
    }
    // Verificar se já existe uma foto do tipo especificado
    const existingPhoto = await this.photoRepo.findOne({
      where: { taskId, type },
    });
    if (existingPhoto) {
      throw new BadRequestException(`Já existe uma foto de tipo ${type} para esta tarefa. Máximo 1 de cada tipo.`);
    }
    const e = this.photoRepo.create({ id: uuid(), taskId, type, url, key });
    return this.photoRepo.save(e);
  }

  async findValidationQueue(): Promise<(Task & { photos: TaskPhoto[] })[]> {
    const tasks = await this.repo.find({
      where: { status: 'IN_REVIEW' },
      order: { updatedAt: 'DESC' },
    });
    const taskIds = tasks.map((t) => t.id);
    if (taskIds.length === 0) return tasks.map((t) => ({ ...t, photos: [] }));
    const photos = await this.photoRepo.find({ where: { taskId: In(taskIds) } });
    const byTask = photos.reduce((acc, p) => {
      if (!acc[p.taskId]) acc[p.taskId] = [];
      acc[p.taskId].push(p);
      return acc;
    }, {} as Record<string, TaskPhoto[]>);
    return tasks.map((t) => ({ ...t, photos: byTask[t.id] ?? [] }));
  }

  async approve(id: string, userId: string, ctx?: RequestContext): Promise<Task> {
    const task = await this.findOne(id);
    if (task.status !== 'IN_REVIEW') {
      throw new BadRequestException('Apenas tarefas em validação podem ser aprovadas');
    }
    const previousStatus = task.status;
    const completedAt = task.completedAt ?? new Date();
    await this.repo.update(id, { status: 'DONE', completedAt });
    const updated = await this.findOne(id);
    await this.somaHorasUsoAtivo(updated);
    await this.audit.trailStatusChange(userId, 'Task', id, 'APPROVE', previousStatus, 'DONE', ctx);
    return updated;
  }

  async reject(id: string, userId: string, dto: RejectTaskInput, ctx?: RequestContext): Promise<Task> {
    const task = await this.findOne(id);
    if (task.status !== 'IN_REVIEW') {
      throw new BadRequestException('Apenas tarefas em validação podem ser recusadas');
    }
    const { comment, reason } = rejectTaskSchema.parse(dto);
    const previousStatus = task.status;
    await this.repo.update(id, {
      status: 'IN_PROGRESS',
      rejectedComment: comment,
      rejectedAt: new Date(),
      rejectedBy: userId,
    });
    await this.audit.trailStatusChange(userId, 'Task', id, 'REJECT', previousStatus, 'IN_PROGRESS', ctx, {
      comment,
      reason: reason ?? null,
    });

    const reexec = this.repo.create({
      id: uuid(),
      areaId: task.areaId,
      employeeId: task.employeeId,
      scheduledDate: new Date(),
      scheduledTime: task.scheduledTime,
      status: 'PENDING',
      title: `Reexecução: ${task.title ?? 'Tarefa'} (motivo: ${comment.slice(0, 50)}...)`,
      description: `Tarefa de reexecução. Motivo da não conformidade: ${comment}`,
      estimatedMinutes: task.estimatedMinutes,
    });
    await this.repo.save(reexec);

    return this.findOne(id);
  }

  async update(
    id: string,
    dto: TaskUpdateInput,
    userId?: string,
    ctx?: RequestContext,
    user?: UpdateUser,
  ): Promise<Task> {
    const data = taskUpdateSchema.parse(dto);
    const task = await this.findOne(id);

    if (user?.role === 'AUXILIAR') {
      if (task.employeeId !== user.employeeId) {
        throw new BadRequestException('Você só pode atualizar tarefas atribuídas a você.');
      }
      const allowed = ['status', 'checkinLat', 'checkinLng', 'checkoutLat', 'checkoutLng', 'ativoId'];
      const keys = Object.keys(data) as (keyof TaskUpdateInput)[];
      for (const k of keys) {
        if (!allowed.includes(k)) {
          throw new BadRequestException(`Campo ${String(k)} não permitido para seu perfil.`);
        }
      }
    }
    if (data.areaId !== undefined) await this.validateAreaExists(data.areaId);
    const empId = data.employeeId ?? task.employeeId;
    if (empId) {
      await this.validateEmployeeActive(empId);
      await this.validateNoScheduleOverlap(
        empId,
        data.scheduledDate ?? task.scheduledDate,
        data.scheduledTime ?? task.scheduledTime,
        data.estimatedMinutes ?? task.estimatedMinutes,
        id,
      );
    }
    if (data.status === 'IN_REVIEW') {
      if (task.status !== 'PENDING' && task.status !== 'IN_PROGRESS') {
        throw new BadRequestException('Só tarefas com status PENDING ou IN_PROGRESS podem ser enviadas para validação');
      }
      await this.validateMinPhotosForReview(id);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (data.scheduledDate !== undefined && data.scheduledDate < today) {
      throw new BadRequestException('Data agendada não pode ser no passado');
    }
    if (data.status !== undefined && data.status !== task.status && userId) {
      await this.audit.trailStatusChange(
        userId,
        'Task',
        id,
        'UPDATE',
        task.status,
        data.status,
        ctx,
      );
    }

    const updatePayload: Partial<Task> = { ...data };
    const now = new Date();

    if (data.status === 'IN_PROGRESS' && task.status !== 'IN_PROGRESS') {
      const empId = task.employeeId ?? data.employeeId;
      if (empId) {
        const isFirst = await this.procedimentos.isFirstTimeInArea(empId, task.areaId);
        if (isFirst) {
          const hasWatched = await this.procedimentos.hasWatchedRequiredProcedimento(empId, task.areaId);
          if (!hasWatched) {
            throw new BadRequestException(
              'Primeira vez neste setor. Assista ao vídeo de treinamento antes do check-in.',
            );
          }
        }
      }
      updatePayload.startedAt = now;
      if (data.checkinLat != null && data.checkinLng != null) {
        updatePayload.checkinLat = data.checkinLat;
        updatePayload.checkinLng = data.checkinLng;
      }
      if (data.ativoId != null) {
        await this.validateAtivoOperacional(data.ativoId);
        updatePayload.ativoId = data.ativoId;
      }
    }
    if (data.status === 'IN_REVIEW' && task.status !== 'IN_REVIEW') {
      updatePayload.completedAt = now;
    }
    if (data.status === 'DONE' && task.status !== 'DONE') {
      updatePayload.completedAt = updatePayload.completedAt ?? now;
      if (data.checkoutLat != null && data.checkoutLng != null) {
        updatePayload.checkoutLat = data.checkoutLat;
        updatePayload.checkoutLng = data.checkoutLng;
      }
      const ativoId = data.ativoId ?? task.ativoId;
      if (ativoId) updatePayload.ativoId = ativoId;
    }
    if (data.ativoId !== undefined) updatePayload.ativoId = data.ativoId;

    await this.repo.update(id, updatePayload);

    if ((data.status === 'IN_REVIEW' || data.status === 'DONE') && task.status !== data.status) {
      const updated = await this.findOne(id);
      await this.somaHorasUsoAtivo(updated);
      try {
        const area = await this.areaRepo.findOne({ where: { id: updated.areaId } });
        if (area && this.digitalTwinGateway) {
          this.digitalTwinGateway.emitAreaUpdated({
            locationId: area.locationId,
            areaId: updated.areaId,
            status: 'GREEN',
          });
        }
        if (this.suprimentos && updated.areaId) {
          await this.suprimentos.verificarEstoqueEgerarPedidos(updated.areaId);
        }
      } catch {
        // não falhar a operação se o emit/verificação falhar
      }
    }
    return this.findOne(id);
  }

  private async validateAtivoOperacional(ativoId: string): Promise<void> {
    const ativo = await this.ativoRepo.findOne({ where: { id: ativoId } });
    if (!ativo) throw new BadRequestException('Ativo não encontrado');
    if (ativo.status !== 'OPERACIONAL') {
      throw new BadRequestException(
        `Ativo "${ativo.nome}" não está operacional (status: ${ativo.status}). Não pode ser usado em tarefas.`,
      );
    }
  }

  /**
   * CMMS: ao check-out (IN_REVIEW) ou aprovação (DONE), soma (completedAt - startedAt) em horas
   * ao horas_uso_total do ativo. Evita soma duplicada com flag ativoHorasSomadas.
   */
  private async somaHorasUsoAtivo(task: Task): Promise<void> {
    if (!task.ativoId || !task.startedAt || task.ativoHorasSomadas) return;
    const completedAt = task.completedAt ?? new Date();
    const started = new Date(task.startedAt).getTime();
    const completed = new Date(completedAt).getTime();
    const horasUso = (completed - started) / (1000 * 60 * 60);
    if (horasUso <= 0) return;
    const ativo = await this.ativoRepo.findOne({ where: { id: task.ativoId } });
    if (!ativo) return;
    const novoTotal = (ativo.horasUsoTotal ?? 0) + horasUso;
    await this.ativoRepo.update(task.ativoId, { horasUsoTotal: novoTotal });
    await this.repo.update(task.id, { ativoHorasSomadas: true });
    const ativoAtualizado = await this.ativoRepo.findOne({ where: { id: task.ativoId } });
    if (ativoAtualizado) {
      await this.ativosService.verificarLimiteEAutoTask(ativoAtualizado);
    }
  }

  private async validateMinPhotosForReview(taskId: string): Promise<void> {
    const photos = await this.photoRepo.find({ where: { taskId } });
    const before = photos.filter((p) => p.type === 'BEFORE').length;
    const after = photos.filter((p) => p.type === 'AFTER').length;
    if (before < MIN_PHOTOS_BEFORE || after < MIN_PHOTOS_AFTER) {
      throw new BadRequestException(
        `Para enviar à validação é necessário pelo menos ${MIN_PHOTOS_BEFORE} foto(s) ANTES e ${MIN_PHOTOS_AFTER} foto(s) DEPOIS`,
      );
    }
  }

  /**
   * Cria tarefas automáticas baseadas em cleaning_frequency das áreas.
   * DAILY: 1 tarefa/dia; DAILY_2X: 2 tarefas (manhã/tarde); WEEKLY: 1 tarefa/semana (segunda).
   */
  async scheduleAutoTasks(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const areas = await this.areaRepo.find({ order: { name: 'ASC' } });
    let created = 0;

    for (const area of areas) {
      const freq = (area.cleaningFrequency ?? '').toUpperCase();
      if (!freq) continue;

      const existing = await this.repo.count({
        where: { areaId: area.id, scheduledDate: today },
      });

      if (freq === 'DAILY' && existing === 0) {
        const e = this.repo.create({
          id: uuid(),
          areaId: area.id,
          scheduledDate: today,
          status: 'PENDING',
        });
        await this.repo.save(e);
        created++;
      } else if (freq === 'DAILY_2X' && existing < 2) {
        const slots = existing === 0 ? ['08:00', '14:00'] : ['14:00'];
        for (const time of slots) {
          const e = this.repo.create({
            id: uuid(),
            areaId: area.id,
            scheduledDate: today,
            scheduledTime: time,
            status: 'PENDING',
          });
          await this.repo.save(e);
          created++;
        }
      } else if (freq === 'WEEKLY' && dayOfWeek === 1 && existing === 0) {
        const e = this.repo.create({
          id: uuid(),
          areaId: area.id,
          scheduledDate: today,
          status: 'PENDING',
        });
        await this.repo.save(e);
        created++;
      }
    }
    return created;
  }

  /** Marca como LATE tarefas cujo scheduled_date + scheduled_time já passou e status é PENDING ou IN_PROGRESS. */
  async markLateTasks(): Promise<number> {
    const now = new Date();
    const tasks = await this.repo.find({
      where: [{ status: 'PENDING' }, { status: 'IN_PROGRESS' }],
    });
    let count = 0;
    for (const t of tasks) {
      const scheduledDate = new Date(t.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      let deadline: Date;
      if (t.scheduledTime && /^\d{1,2}:\d{2}$/.test(t.scheduledTime)) {
        const [h, m] = t.scheduledTime.split(':').map(Number);
        deadline = new Date(scheduledDate);
        deadline.setHours(h, m, 0, 0);
      } else {
        deadline = new Date(scheduledDate);
        deadline.setHours(23, 59, 59, 999);
      }
      if (now > deadline) {
        await this.repo.update(t.id, { status: 'LATE' });
        count++;
      }
    }
    return count;
  }

  async remove(id: string, userId?: string, ctx?: RequestContext): Promise<void> {
    const task = await this.findOne(id);
    if (task.status === 'DONE') {
      throw new BadRequestException('Não é permitido excluir tarefa já concluída (DONE)');
    }
    if (userId) await this.audit.trailStatusChange(userId, 'Task', id, 'DELETE', task.status, null, ctx);
    await this.repo.delete(id);
  }
}
