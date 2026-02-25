// ============================================
// AuthModule — Registers all auth components
// Like: adding AuthServiceProvider to config/app.php
// This module connects: Controller + Service + JWT + Strategy
// ============================================

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
// JwtModule provides the JwtService we use to create tokens

import { PassportModule } from '@nestjs/passport';
// PassportModule enables the authentication strategies (JWT, Local, etc.)

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // Enable Passport with JWT as default strategy
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Configure JWT module
    // Note: we pass secrets in AuthService.generateTokens() instead
    // This just registers the JwtService so we can inject it
    JwtModule.register({}),
  ],
  controllers: [AuthController],  // Register the controller (routes)
  providers: [AuthService, JwtStrategy], // Register service + strategy
  exports: [AuthService], // Allow other modules to use AuthService
})
export class AuthModule {}