import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditService } from '../../modules/audit/audit.service';

const ENTITY_MAP: Record<string, string> = {
  employees: 'Employee',
  locations: 'Location',
  areas: 'Area',
  tasks: 'Task',
  materials: 'Material',
  'time-clock': 'TimeClock',
  upload: 'Upload',
  audit: 'Audit',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    if (req.path.startsWith('/auth')) return next.handle();

    const method = req.method;
    const action = method === 'POST' ? 'CREATE' : method === 'PATCH' ? 'UPDATE' : method === 'DELETE' ? 'DELETE' : null;
    if (!action) return next.handle();

    const user = (req as unknown as { user?: { sub?: string } }).user;
    const userId = user?.sub;
    if (!userId) return next.handle();

    const segments = req.path.split('/').filter(Boolean);
    const entityKey = segments[0];
    const entity = ENTITY_MAP[entityKey] ?? entityKey;
    const entityId = (req.params as { id?: string }).id ?? undefined;
    const payload = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : undefined;

    return next.handle().pipe(
      tap(() => {
        this.audit.log(userId, action, entity, entityId, payload).catch(() => {});
      }),
    );
  }
}
