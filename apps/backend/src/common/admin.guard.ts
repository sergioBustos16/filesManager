import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthUser } from './types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
    const isAdmin = request.user?.groups?.includes('Admin');
    if (!isAdmin) {
      throw new ForbiddenException('Admin role required.');
    }
    return true;
  }
}
