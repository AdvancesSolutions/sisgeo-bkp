import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Task } from '../../entities/task.entity';
import { TaskPhoto } from '../../entities/task-photo.entity';
import { Area } from '../../entities/area.entity';
import { Employee } from '../../entities/employee.entity';
import { TasksService } from './tasks.service';
import { AuditService } from '../audit/audit.service';

describe('TasksService (regras de negócio)', () => {
  let service: TasksService;
  let taskRepo: jest.Mocked<Repository<Task>>;
  let photoRepo: jest.Mocked<Repository<TaskPhoto>>;
  let areaRepo: jest.Mocked<Repository<Area>>;
  let employeeRepo: jest.Mocked<Repository<Employee>>;
  let auditService: jest.Mocked<AuditService>;

  const areaId = uuid();
  const taskId = uuid();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: mockRepo },
        { provide: getRepositoryToken(TaskPhoto), useValue: { ...mockRepo } },
        { provide: getRepositoryToken(Area), useValue: { ...mockRepo } },
        { provide: getRepositoryToken(Employee), useValue: { ...mockRepo } },
        { provide: AuditService, useValue: { log: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get(TasksService);
    taskRepo = module.get(getRepositoryToken(Task));
    photoRepo = module.get(getRepositoryToken(TaskPhoto));
    areaRepo = module.get(getRepositoryToken(Area));
    employeeRepo = module.get(getRepositoryToken(Employee));
    auditService = module.get(AuditService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve rejeitar quando área não existe', async () => {
      (areaRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.create({
          areaId,
          scheduledDate: tomorrow,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create({
          areaId,
          scheduledDate: tomorrow,
        }),
      ).rejects.toThrow('Área não encontrada');
    });

    it('deve rejeitar quando data agendada é no passado', async () => {
      (areaRepo.findOne as jest.Mock).mockResolvedValue({ id: areaId });
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      await expect(
        service.create({
          areaId,
          scheduledDate: yesterday,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create({
          areaId,
          scheduledDate: yesterday,
        }),
      ).rejects.toThrow('Data agendada não pode ser no passado');
    });

    it('deve criar quando área existe e data é hoje ou futura', async () => {
      (areaRepo.findOne as jest.Mock).mockResolvedValue({ id: areaId });
      const saved = { id: taskId, areaId, scheduledDate: tomorrow, status: 'PENDING' };
      (taskRepo.create as jest.Mock).mockReturnValue(saved);
      (taskRepo.save as jest.Mock).mockResolvedValue(saved);
      const result = await service.create({ areaId, scheduledDate: tomorrow });
      expect(result).toEqual(saved);
      expect(areaRepo.findOne).toHaveBeenCalledWith({ where: { id: areaId } });
    });

    it('deve rejeitar quando funcionário atribuído não está ACTIVE (T7)', async () => {
      const empId = uuid();
      (areaRepo.findOne as jest.Mock).mockResolvedValue({ id: areaId });
      (employeeRepo.findOne as jest.Mock).mockResolvedValue({ id: empId, status: 'INACTIVE' });
      await expect(
        service.create({ areaId, employeeId: empId, scheduledDate: tomorrow }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create({ areaId, employeeId: empId, scheduledDate: tomorrow }),
      ).rejects.toThrow('ACTIVE');
    });
  });

  describe('addPhoto', () => {
    it('deve rejeitar quando tarefa não está PENDING ou IN_PROGRESS', async () => {
      (taskRepo.findOne as jest.Mock).mockResolvedValue({ id: taskId, status: 'IN_REVIEW' });
      await expect(
        service.addPhoto(taskId, 'BEFORE', 'https://example.com/1.jpg', 'key1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addPhoto(taskId, 'BEFORE', 'https://example.com/1.jpg', 'key1'),
      ).rejects.toThrow('PENDING ou IN_PROGRESS');
    });

    it('deve aceitar quando tarefa está PENDING', async () => {
      (taskRepo.findOne as jest.Mock).mockResolvedValue({ id: taskId, status: 'PENDING' });
      const photo = { id: uuid(), taskId, type: 'BEFORE', url: 'https://example.com/1.jpg', key: 'key1' };
      (photoRepo.create as jest.Mock).mockReturnValue(photo);
      (photoRepo.save as jest.Mock).mockResolvedValue(photo);
      const result = await service.addPhoto(taskId, 'BEFORE', photo.url, photo.key);
      expect(result).toEqual(photo);
    });
  });

  describe('update (status IN_REVIEW)', () => {
    it('deve rejeitar IN_REVIEW quando não há fotos mínimas (1 BEFORE, 1 AFTER)', async () => {
      (taskRepo.findOne as jest.Mock)
        .mockResolvedValueOnce({ id: taskId, status: 'IN_PROGRESS', areaId })
        .mockResolvedValueOnce({ id: taskId, status: 'IN_PROGRESS' });
      (areaRepo.findOne as jest.Mock).mockResolvedValue({ id: areaId });
      (photoRepo.find as jest.Mock).mockResolvedValue([{ type: 'BEFORE' }]); // só BEFORE, falta AFTER
      await expect(
        service.update(taskId, { status: 'IN_REVIEW' }, 'user-id'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(taskId, { status: 'IN_REVIEW' }, 'user-id'),
      ).rejects.toThrow('pelo menos');
    });

    it('deve rejeitar IN_REVIEW quando status atual não é PENDING ou IN_PROGRESS', async () => {
      (taskRepo.findOne as jest.Mock).mockResolvedValue({ id: taskId, status: 'DONE', areaId });
      await expect(
        service.update(taskId, { status: 'IN_REVIEW' }, 'user-id'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(taskId, { status: 'IN_REVIEW' }, 'user-id'),
      ).rejects.toThrow('PENDING ou IN_PROGRESS');
    });

    it('deve aceitar IN_REVIEW quando há 1 BEFORE e 1 AFTER', async () => {
      (taskRepo.findOne as jest.Mock)
        .mockResolvedValueOnce({ id: taskId, status: 'IN_PROGRESS', areaId })
        .mockResolvedValueOnce({ id: taskId, status: 'IN_REVIEW' });
      (areaRepo.findOne as jest.Mock).mockResolvedValue({ id: areaId });
      (photoRepo.find as jest.Mock).mockResolvedValue([
        { type: 'BEFORE' },
        { type: 'AFTER' },
      ]);
      (taskRepo.update as jest.Mock).mockResolvedValue(undefined);
      const result = await service.update(taskId, { status: 'IN_REVIEW' }, 'user-id');
      expect(result.status).toBe('IN_REVIEW');
    });
  });

  describe('remove', () => {
    it('deve rejeitar exclusão quando tarefa está DONE', async () => {
      (taskRepo.findOne as jest.Mock).mockResolvedValue({ id: taskId, status: 'DONE' });
      await expect(service.remove(taskId, 'user-id')).rejects.toThrow(BadRequestException);
      await expect(service.remove(taskId, 'user-id')).rejects.toThrow('Não é permitido excluir tarefa já concluída');
    });

    it('deve rejeitar quando tarefa não existe', async () => {
      (taskRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.remove(taskId, 'user-id')).rejects.toThrow(NotFoundException);
    });
  });
});
