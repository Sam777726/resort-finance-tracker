import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  name: string;
  role: 'admin' | 'staff';
}

/** Pulls the JWT-verified user off the request — populated by JwtStrategy.
 * Usage: `findAll(@CurrentUser() user: AuthUser)`. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
