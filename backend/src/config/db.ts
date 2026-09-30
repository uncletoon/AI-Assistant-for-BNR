import './env.js';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabaseConnection(timeoutMs = 3000): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  let timer: NodeJS.Timeout | undefined;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Database check timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);
    if (timer) clearTimeout(timer);
    return {
      connected: true,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    if (timer) clearTimeout(timer);
    const message = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      error: message,
    };
  }
}

