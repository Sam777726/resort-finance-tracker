import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { StaffRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/** Runs after JwtAuthGuard (which populates request.user). No @Roles()
 * metadata on the route means "any authenticated staff member" — role
 * checks are opt-in per endpoint, not a separate allowlist to keep in sync. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<StaffRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException(`Requires one of role(s): ${required.join(', ')}`);
    }
    return true;
  }
}
