// ============================================
// AppModule — The Root Module (imports everything)
// Like: config/app.php 'providers' array in Laravel
// ============================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    // Load .env file globally
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),

    // Database — available globally
    PrismaModule,

    // Authentication — register, login, JWT
    AuthModule,

    // We'll add more modules here:
    // UsersModule,
    // SitesModule,
    // AuditsModule,
  ],
})
export class AppModule {}