import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { User } from '../../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findAll() {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async create(data: any) {
    const existing = await this.repo.findOne({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email já cadastrado');

    const hash = await bcrypt.hash(data.password || data.senha, 10);
    const user = this.repo.create({
      id: uuid(),
      name: data.nome || data.name,
      email: data.email,
      role: data.role,
      passwordHash: hash,
    });
    return this.repo.save(user);
  }

  async update(id: string, data: any) {
    const user = await this.findOne(id);
    if (data.email && data.email !== user.email) {
      const existing = await this.repo.findOne({ where: { email: data.email } });
      if (existing) throw new ConflictException('Email já cadastrado');
    }

    const updateData: any = {};
    if (data.nome || data.name) updateData.name = data.nome || data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;

    await this.repo.update(id, updateData);
    return this.findOne(id);
  }

  async updatePassword(id: string, newPassword: string) {
    const hash = await bcrypt.hash(newPassword, 10);
    await this.repo.update(id, { passwordHash: hash });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
