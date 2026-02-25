// prisma.config.ts — Prisma 7 requires this file
// In Prisma 6, the database URL was in schema.prisma
// In Prisma 7, it moved here — cleaner separation
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});