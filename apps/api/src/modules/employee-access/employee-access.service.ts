import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { User } from '../../entities/user.entity';
import { Employee } from '../../entities/employee.entity';
import { Location } from '../../entities/location.entity';
import {
  createEmployeeAccessSchema,
  resetEmployeeAccessSchema,
} from '@sigeo/shared';
import type {
  CreateEmployeeAccessInput,
  ResetEmployeeAccessInput,
} from '@sigeo/shared';

export interface EmployeeAccessItem {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  unitId: string;
  unitName?: string;
  hasAccess: boolean;
  userId?: string;
  email?: string;
}

@Injectable()
export class EmployeeAccessService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
  ) {}

  async list(): Promise<EmployeeAccessItem[]> {
    const [employees, allUsers, locations] = await Promise.all([
      this.employeeRepo.find({ order: { name: 'ASC' } }),
      this.userRepo.find(),
      this.locationRepo.find(),
    ]);
    const usersByEmployeeId = new Map<string, User>();
    const locationsById = new Map(locations.map((l) => [l.id, l]));
    for (const u of allUsers) {
      if (u.employeeId) usersByEmployeeId.set(u.employeeId, u);
    }
    return employees.map((emp) => {
      const user = usersByEmployeeId.get(emp.id);
      const loc = locationsById.get(emp.unitId);
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        employeeRole: emp.role,
        unitId: emp.unitId,
        unitName: loc?.name,
        hasAccess: !!user,
        userId: user?.id,
        email: user?.email,
      };
    });
  }

  async create(dto: CreateEmployeeAccessInput): Promise<{ userId: string; email: string }> {
    const data = createEmployeeAccessSchema.parse(dto);
    const employee = await this.employeeRepo.findOne({ where: { id: data.employeeId } });
    if (!employee) throw new NotFoundException('Funcionário não encontrado');

    const existingUser = await this.userRepo.findOne({
      where: { employeeId: data.employeeId },
    });
    if (existingUser) {
      throw new ConflictException('Este funcionário já possui acesso cadastrado');
    }

    const emailExists = await this.userRepo.findOne({ where: { email: data.email } });
    if (emailExists) {
      throw new ConflictException('Este e-mail já está em uso');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = this.userRepo.create({
      id: uuid(),
      name: employee.name,
      email: data.email.trim().toLowerCase(),
      role: 'AUXILIAR',
      passwordHash,
      employeeId: employee.id,
    });
    await this.userRepo.save(user);
    return { userId: user.id, email: user.email };
  }

  async resetPassword(employeeId: string, dto: ResetEmployeeAccessInput): Promise<void> {
    const data = resetEmployeeAccessSchema.parse(dto);
    const user = await this.userRepo.findOne({ where: { employeeId } });
    if (!user) throw new NotFoundException('Funcionário não possui acesso cadastrado');

    const passwordHash = await bcrypt.hash(data.password, 10);
    await this.userRepo.update(user.id, { passwordHash });
  }

  async revoke(employeeId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { employeeId } });
    if (!user) throw new NotFoundException('Funcionário não possui acesso cadastrado');

    await this.userRepo.delete(user.id);
  }
}
