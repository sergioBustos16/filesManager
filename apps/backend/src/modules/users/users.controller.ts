import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import type { AuthUser } from '../../common/types';

@Controller('users')
export class UsersController {
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
