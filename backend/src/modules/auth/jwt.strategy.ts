// ============================================
// JwtStrategy — Validates JWT tokens on protected routes
// Like: auth:sanctum middleware in Laravel
// When someone sends Authorization: Bearer <token>
// This strategy extracts and validates the token
// ============================================

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/prisma/prisma.service';

// The payload inside the JWT token
interface JwtPayload {
  sub: string;    // User ID
  email: string;  // User email
  role: string;   // User role
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  constructor(
    private prisma: PrismaService,
    configService: ConfigService,
  ) {
    // Read secret from config (with fallback)
    const secret = configService.get<string>('app.jwt.secret') || 'default-secret';

    // Configure how to extract and validate JWT
    super({
      // Extract token from: Authorization: Bearer eyJhbGciOi...
      // Like: $request->bearerToken() in Laravel
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Don't accept expired tokens
      ignoreExpiration: false,

      // Secret key to verify the token signature
      secretOrKey: secret,
    });
  }

  // Runs AFTER token is verified — whatever we return becomes req.user
  // Like: Auth::user() in Laravel
  async validate(payload: JwtPayload) {
    // Check if user still exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer active');
    }

    // This becomes req.user in controllers
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}