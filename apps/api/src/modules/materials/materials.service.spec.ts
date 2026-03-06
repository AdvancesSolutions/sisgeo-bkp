import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Material } from '../../entities/material.entity';
import { MaterialsService } from './materials.service';

describe('MaterialsService (regras de negócio)', () => {
  let service: MaterialsService;
  let repo: jest.Mocked<Repository<Material>>;
  const materialId = uuid();

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialsService,
        { provide: getRepositoryToken(Material), useValue: mockRepo },
      ],
    }).compile();

    service = module.get(MaterialsService);
    repo = module.get(getRepositoryToken(Material));
    jest.clearAllMocks();
  });

  describe('update', () => {
    it('deve rejeitar quando estoque é negativo (regra M1)', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({ id: materialId, name: 'Item', unit: 'un', stock: 10 });
      try {
        await service.update(materialId, { stock: -1 });
        expect(true).toBe(false);
      } catch (e: unknown) {
        const msg = (e as Error)?.message ?? String(e);
        expect(msg).toMatch(/negativo|greater than or equal to 0|minimum/i);
      }
    });

    it('deve aceitar quando estoque é zero ou positivo', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({ id: materialId, name: 'Item', unit: 'un', stock: 10 });
      (repo.update as jest.Mock).mockResolvedValue(undefined);
      (repo.findOne as jest.Mock).mockResolvedValue({ id: materialId, name: 'Item', unit: 'un', stock: 0 });
      const result = await service.update(materialId, { stock: 0 });
      expect(result.stock).toBe(0);
    });

    it('deve rejeitar quando material não existe', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.update(materialId, { stock: 5 })).rejects.toThrow(NotFoundException);
    });
  });
});
