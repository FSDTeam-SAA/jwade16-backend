import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'role',
      ctx.getHandler(),
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as { role: string };
    console.log('Required roles:', requiredRoles);
    console.log('Request user in RolesGuard:', user);

    return requiredRoles.includes(user.role);
  }
}
