// ============================================
// PrismaService — Our Database Connection (Prisma 7)
// Like: DB facade in Laravel (DB::table('users'))
// Prisma 7 requires an "adapter" to connect to PostgreSQL
// ============================================

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  constructor() {
    // Create a PostgreSQL connection pool
    // Like: DB_CONNECTION=pgsql in Laravel .env
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Create the Prisma adapter for PostgreSQL
    // Prisma 7 requires this — it connects Prisma to the pg driver
    const adapter = new PrismaPg(pool);

    // Pass the adapter to PrismaClient
    // super() calls the parent class (PrismaClient) constructor
    super({ adapter });
  }

  // When the app starts → connect to PostgreSQL
  async onModuleInit() {
    await this.$connect();
    console.log('Database connected');
  }

  // When the app stops → disconnect cleanly
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Database disconnected');
  }
}