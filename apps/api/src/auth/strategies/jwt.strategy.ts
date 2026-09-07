import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AppConfig } from '../../config/configuration';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

interface AccessTokenPayload {
  sub: string;
  name: string;
  role: 'admin' | 'staff';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService<AppConfig, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('jwt.accessSecret', { infer: true }),
    });
  }

  /** Return value becomes `request.user` — deliberately just the JWT's own
   * claims (no DB round-trip per request); see AuthService for the
   * short-lived-token tradeoff this implies. */
  validate(payload: AccessTokenPayload): AuthUser {
    return { id: payload.sub, name: payload.name, role: payload.role };
  }
}
