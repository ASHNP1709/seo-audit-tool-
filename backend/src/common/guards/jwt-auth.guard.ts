// ============================================
// JwtAuthGuard — Protects routes from unauthorized access
// Like: Route::middleware('auth:sanctum') in Laravel
//
// Usage in controllers:
// @UseGuards(JwtAuthGuard)     ← on a single route
// @UseGuards(JwtAuthGuard)     ← on entire controller (all routes)
// ============================================

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // AuthGuard('jwt') automatically uses our JwtStrategy
  // If token is valid → allows the request through
  // If token is missing/invalid/expired → returns 401 Unauthorized
  // That's it! One line does all the work.
}