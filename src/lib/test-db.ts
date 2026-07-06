import prisma from './prisma';

async function main() {
  try {
    const userCount = await prisma.user.count();
    console.log(`Prisma successfully connected. Current user count: ${userCount}`);
  } catch (error) {
    console.error('Failed to connect to database via Prisma client:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
