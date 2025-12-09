import { ExtractJwt, Strategy as JwtStrategyBase } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

interface JwtPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(JwtStrategyBase) {
  constructor() {
    const secret = process.env.JWT_SECRET || 'secret';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() as () =>
        | string
        | null,
      secretOrKey: secret,
      ignoreExpiration: false,
    });
    console.log('🔐 JwtStrategy initialized');
    console.log(
      '   Secret:',
      secret ? `${secret.substring(0, 10)}...` : '❌ Missing',
    );
    console.log('   Length:', secret.length);
  }

  validate(payload: JwtPayload) {
    console.log('🔍 JWT Payload received:', payload);

    if (!payload || !payload.sub) {
      console.error('❌ Invalid JWT payload - missing sub (user ID)');
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = { userId: payload.sub, role: payload.role };
    console.log('✅ User validated:', user);
    return user;
  }
}
