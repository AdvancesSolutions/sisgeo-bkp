import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;
    const { user } = context.switchToHttp().getRequest();
    const userRole = (user?.role || '').toUpperCase().replace(/\s/g, '_');
    
    const hasRole = requiredRoles.some((role) => {
      const normalizedRole = role.toUpperCase().replace(/\s/g, '_');
      // ADMIN e SUPER_ADMIN são intercambiáveis para permissões de alto nível
      if ((userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN')) {
        return true;
      }
      return userRole === normalizedRole;
    });
    if (!hasRole) {
      throw new ForbiddenException('Acesso negado para este perfil.');
    }
    return true;
  }
}
