import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tagNames = ['financeiro', 'rh'];

  for (const name of tagNames) {
    await prisma.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  const tags = await prisma.tag.findMany({
    where: { name: { in: tagNames } },
  });

  const users = await prisma.user.findMany({ select: { id: true } });

  for (const user of users) {
    for (const tag of tags) {
      await prisma.userTag
        .create({
          data: { userId: user.id, tagId: tag.id },
        })
        .catch(() => {});
    }
  }

  console.log('Seed concluido: usuarios vinculados a financeiro e rh');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
