import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** Opts a route out of the global JwtAuthGuard — used only on
 * AuthController's staff/setup/login/refresh endpoints. Every other route
 * requires a valid access token by default; this is the explicit escape
 * hatch rather than the default. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
