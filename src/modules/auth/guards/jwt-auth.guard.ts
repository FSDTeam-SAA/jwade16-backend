import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    console.log(
      '🛡️ JwtAuthGuard - Authorization header:',
      authHeader ? '✅ Present' : '❌ Missing',
    );

    if (!authHeader) {
      console.error('❌ No authorization header found');
      throw new UnauthorizedException('No authorization token provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.error(
        '❌ Invalid authorization header format. Expected: Bearer <token>',
      );
      throw new UnauthorizedException('Invalid authorization header format');
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    console.log('🔐 JwtAuthGuard handleRequest:', { err, user, info });

    if (err || !user) {
      console.error('❌ Authentication failed:', err || info);
      throw err || new UnauthorizedException(info?.message || 'Unauthorized');
    }

    console.log('✅ Authentication successful for user:', user);
    return user;
  }
}
