import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Employee } from '../../entities/employee.entity';
import { Location } from '../../entities/location.entity';
import { EmployeesService } from './employees.service';

describe('EmployeesService (regras de negócio)', () => {
  let service: EmployeesService;
  let employeeRepo: jest.Mocked<Repository<Employee>>;
  let locationRepo: jest.Mocked<Repository<Location>>;
  const unitId = uuid();

  beforeEach(async () => {
    const mockEmployeeRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    const mockLocationRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: getRepositoryToken(Employee), useValue: mockEmployeeRepo },
        { provide: getRepositoryToken(Location), useValue: mockLocationRepo },
      ],
    }).compile();

    service = module.get(EmployeesService);
    employeeRepo = module.get(getRepositoryToken(Employee));
    locationRepo = module.get(getRepositoryToken(Location));
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve rejeitar quando unidade (unitId) não existe (regra E3)', async () => {
      (locationRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.create({
          name: 'João',
          role: 'Técnico',
          unitId,
          status: 'ACTIVE',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create({
          name: 'João',
          role: 'Técnico',
          unitId,
          status: 'ACTIVE',
        }),
      ).rejects.toThrow('Unidade (local) não encontrada');
    });

    it('deve criar quando unitId existe', async () => {
      (locationRepo.findOne as jest.Mock).mockResolvedValue({ id: unitId });
      const saved = { id: uuid(), name: 'João', role: 'Técnico', unitId, status: 'ACTIVE' };
      (employeeRepo.create as jest.Mock).mockReturnValue(saved);
      (employeeRepo.save as jest.Mock).mockResolvedValue(saved);
      const result = await service.create({ name: 'João', role: 'Técnico', unitId, status: 'ACTIVE' });
      expect(result.unitId).toBe(unitId);
    });

    it('deve rejeitar quando CPF já está cadastrado (E2)', async () => {
      (locationRepo.findOne as jest.Mock).mockResolvedValue({ id: unitId });
      (employeeRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: uuid(), cpf: '12345678900' }),
      });
      await expect(
        service.create({
          name: 'João',
          role: 'Técnico',
          unitId,
          status: 'ACTIVE',
          cpf: '123.456.789-00',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create({
          name: 'João',
          role: 'Técnico',
          unitId,
          status: 'ACTIVE',
          cpf: '123.456.789-00',
        }),
      ).rejects.toThrow('CPF já cadastrado');
    });
  });

  describe('update', () => {
    it('deve rejeitar quando unitId não existe', async () => {
      const empId = uuid();
      const newUnitId = uuid();
      (employeeRepo.findOne as jest.Mock).mockResolvedValue({ id: empId, unitId });
      (locationRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.update(empId, { unitId: newUnitId })).rejects.toThrow(BadRequestException);
    });
  });
});
