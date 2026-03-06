import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Area } from '../../entities/area.entity';
import { Location } from '../../entities/location.entity';
import { AreasService } from './areas.service';

describe('AreasService (regras de negócio)', () => {
  let service: AreasService;
  let areaRepo: jest.Mocked<Repository<Area>>;
  let locationRepo: jest.Mocked<Repository<Location>>;
  const locationId = uuid();

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreasService,
        { provide: getRepositoryToken(Area), useValue: mockRepo },
        { provide: getRepositoryToken(Location), useValue: { ...mockRepo } },
      ],
    }).compile();

    service = module.get(AreasService);
    areaRepo = module.get(getRepositoryToken(Area));
    locationRepo = module.get(getRepositoryToken(Location));
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve rejeitar quando local (locationId) não existe (regra L1)', async () => {
      (locationRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.create({
          locationId,
          name: 'Área A',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create({
          locationId,
          name: 'Área A',
        }),
      ).rejects.toThrow('Local não encontrado');
    });

    it('deve criar quando locationId existe', async () => {
      (locationRepo.findOne as jest.Mock).mockResolvedValue({ id: locationId });
      const saved = { id: uuid(), locationId, name: 'Área A' };
      (areaRepo.create as jest.Mock).mockReturnValue(saved);
      (areaRepo.save as jest.Mock).mockResolvedValue(saved);
      const result = await service.create({ locationId, name: 'Área A' });
      expect(result.locationId).toBe(locationId);
    });
  });

  describe('findOne', () => {
    it('deve lançar NotFoundException quando área não existe', async () => {
      (areaRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne(uuid())).rejects.toThrow(NotFoundException);
      await expect(service.findOne(uuid())).rejects.toThrow('Área não encontrada');
    });
  });
});
