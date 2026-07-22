import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../../../../.env');

dotenv.config({
  path: envPath,
});

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const PORT = process.env.PORT || '3000';
export const HOST = process.env.HOST || 'localhost';
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET;

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;