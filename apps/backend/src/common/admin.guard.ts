import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthUser } from './types';
import { hasAdminAccess } from './authz';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
    const isAdmin = hasAdminAccess(request.user);
    if (!isAdmin) {
      throw new ForbiddenException('Admin role required.');
    }
    return true;
  }
}
