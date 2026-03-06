import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Employee } from '../../entities/employee.entity';
import { Location } from '../../entities/location.entity';
import { employeeSchema, employeeUpdateSchema } from '@sigeo/shared';
import type { EmployeeInput, EmployeeUpdateInput } from '@sigeo/shared';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly repo: Repository<Employee>,
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
  ) {}

  private async validateUnitExists(unitId: string): Promise<void> {
    const loc = await this.locationRepo.findOne({ where: { id: unitId } });
    if (!loc) throw new BadRequestException('Unidade (local) não encontrada');
  }

  /** Regra E2: CPF único no sistema (normalizado, só dígitos). */
  private normalizeCpf(cpf: string | null | undefined): string {
    if (!cpf || typeof cpf !== 'string') return '';
    return cpf.replace(/\D/g, '');
  }

  private async validateCpfUnique(cpfNormalized: string, excludeEmployeeId?: string): Promise<void> {
    if (cpfNormalized.length === 0) return;
    const qb = this.repo
      .createQueryBuilder('e')
      .where("REGEXP_REPLACE(COALESCE(e.cpf, ''), '[^0-9]', '', 'g') = :cpf", { cpf: cpfNormalized });
    if (excludeEmployeeId) qb.andWhere('e.id != :excludeId', { excludeId: excludeEmployeeId });
    const existing = await qb.getOne();
    if (existing) throw new BadRequestException('CPF já cadastrado para outro funcionário');
  }

  async create(dto: EmployeeInput): Promise<Employee> {
    const data = employeeSchema.parse(dto);
    await this.validateUnitExists(data.unitId);
    const cpfNorm = this.normalizeCpf(data.cpf);
    await this.validateCpfUnique(cpfNorm);
    const e = this.repo.create({ id: uuid(), ...data });
    return this.repo.save(e);
  }

  async findAll(page = 1, limit = 50): Promise<{ data: Employee[]; total: number; totalPages: number }> {
    const [data, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    const totalPages = Math.ceil(total / limit) || 1;
    return { data, total, totalPages };
  }

  async findOne(id: string): Promise<Employee> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Funcionário não encontrado');
    return e;
  }

  async update(id: string, dto: EmployeeUpdateInput): Promise<Employee> {
    const data = employeeUpdateSchema.parse(dto);
    await this.findOne(id);
    if (data.unitId !== undefined) await this.validateUnitExists(data.unitId);
    if (data.cpf !== undefined) {
      const cpfNorm = this.normalizeCpf(data.cpf);
      await this.validateCpfUnique(cpfNorm, id);
    }
    await this.repo.update(id, data as Partial<Employee>);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
