import { PrismaClient } from './generated/prisma/client'
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { DATABASE_URL } from '@config/secrets';

const connectionString = `${DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };