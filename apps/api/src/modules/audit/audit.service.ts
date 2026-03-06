import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditTrail } from '../../entities/audit-trail.entity';

export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
    @InjectRepository(AuditTrail)
    private readonly trailRepo: Repository<AuditTrail>,
  ) {}

  /** Registra alteração de status com IP e User-Agent (audit_trail). */
  async trailStatusChange(
    userId: string,
    entity: string,
    entityId: string,
    action: string,
    previousStatus: string | null,
    newStatus: string | null,
    ctx?: RequestContext,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    const e = this.trailRepo.create({
      id: uuid(),
      userId,
      entity,
      entityId,
      action,
      previousStatus,
      newStatus,
      ipAddress: ctx?.ip ?? null,
      userAgent: ctx?.userAgent ?? null,
      payload: payload ? this.sanitize(payload) : null,
    });
    await this.trailRepo.save(e);
  }

  async log(
    userId: string,
    action: string,
    entity: string,
    entityId?: string,
    payload?: Record<string, unknown>,
    _ctx?: RequestContext,
  ): Promise<void> {
    const sanitized = payload ? this.sanitize(payload) : undefined;
    const e = this.repo.create({
      id: uuid(),
      userId,
      action,
      entity,
      entityId: entityId ?? null,
      payload: sanitized ?? null,
    });
    await this.repo.save(e);
  }

  private sanitize(obj: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    const skip = ['password', 'passwordHash', 'token', 'refreshToken', 'secret'];
    for (const [k, v] of Object.entries(obj)) {
      if (skip.some((s) => k.toLowerCase().includes(s))) continue;
      if (v != null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
        out[k] = this.sanitize(v as Record<string, unknown>);
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  async findAllTrail(
    page = 1,
    limit = 50,
    filters?: { entity?: string; entityId?: string },
  ): Promise<{ data: AuditTrail[]; total: number; totalPages: number }> {
    const qb = this.trailRepo.createQueryBuilder('t');
    if (filters?.entity) qb.andWhere('t.entity = :entity', { entity: filters.entity });
    if (filters?.entityId) qb.andWhere('t.entity_id = :entityId', { entityId: filters.entityId });
    qb.orderBy('t.created_at', 'DESC');
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 1;
    return { data, total, totalPages };
  }

  async findAll(
    page = 1,
    limit = 50,
  ): Promise<{ data: AuditLog[]; total: number; totalPages: number }> {
    const [data, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    const totalPages = Math.ceil(total / limit) || 1;
    return { data, total, totalPages };
  }
}
