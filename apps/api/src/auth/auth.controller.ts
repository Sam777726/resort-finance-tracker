import { Body, Controller, Post, UseGuards, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SetupDto } from './dto/setup.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from '../common/decorators/public.decorator';
import { RedisThrottlerGuard, Throttle } from '../common/guards/redis-throttler.guard';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Get('staff')
  @ApiOperation({ summary: 'Public roster for the login picker — no PIN data included' })
  staff() {
    return this.auth.staffRoster();
  }

  @Public()
  @Post('setup')
  @ApiOperation({ summary: 'Create the first admin account — only works while zero staff exist' })
  setup(@Body() dto: SetupDto) {
    return this.auth.setup(dto);
  }

  @Public()
  @Post('login')
  @UseGuards(RedisThrottlerGuard)
  @Throttle({ limit: 8, windowSeconds: 60 })
  @ApiOperation({ summary: 'Log in with a staff id + PIN' })
  @ApiResponse({ status: 429, description: 'Rate limited per-IP via Redis: 8 attempts / 60s' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Exchange a refresh token for a new access+refresh pair (rotates the refresh token)' })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke this staff member\'s refresh token (logs out all their devices)' })
  logout(@CurrentUser() user: AuthUser) {
    return this.auth.logout(user.id).then(() => ({ ok: true }));
  }

  @Get('me')
  @ApiBearerAuth()
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }
}
