import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const createPrismaClient = () => new PrismaClient().$extends(withAccelerate());

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client = createPrismaClient();

  get user() {
    return this.client.user;
  }

  get refreshToken() {
    return this.client.refreshToken;
  }

  get category() {
    return this.client.category;
  }

  get costCenter() {
    return this.client.costCenter;
  }

  get person() {
    return this.client.person;
  }

  get financialTransaction() {
    return this.client.financialTransaction;
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
