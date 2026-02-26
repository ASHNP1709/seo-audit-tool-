// AppModule — The Root Module (imports everything)
// Like: config/app.php 'providers' array in Laravel
// ============================================
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { SitesModule } from './modules/sites/sites.module';
import { AuditsModule } from './modules/audits/audits.module';
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
    // Sites — add/list/manage websites
    SitesModule,
    // Audits — run SEO audits on websites
    AuditsModule,
    // We'll add more modules here:
    // UsersModule,
  ],
})
export class AppModule {}
