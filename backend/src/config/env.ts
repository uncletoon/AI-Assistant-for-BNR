import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// If DATABASE_URL is not explicitly set, construct it from discrete DB_* variables
if (!process.env.DATABASE_URL && process.env.DB_USER && process.env.DB_HOST) {
  const user = encodeURIComponent(process.env.DB_USER);
  const password = process.env.DB_PASSWORD ? encodeURIComponent(process.env.DB_PASSWORD) : '';
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || '5432';
  const name = process.env.DB_NAME || 'agricredit_db';
  const auth = password ? `${user}:${password}` : user;
  process.env.DATABASE_URL = `postgresql://${auth}@${host}:${port}/${name}?schema=public`;
}

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().optional().default('gemini-3.8-flash'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation failed:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
