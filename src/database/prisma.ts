import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function getPrismaClient(): PrismaClient {
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
