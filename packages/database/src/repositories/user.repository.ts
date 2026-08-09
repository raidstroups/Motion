import { User } from '@prisma/client';

import prisma from '../client';

export interface CreateUserInput {
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string;
}

export class UserRepository {
  async create(data: CreateUserInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findMany(params: { skip?: number; take?: number } = {}): Promise<User[]> {
    return prisma.user.findMany({
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(): Promise<number> {
    return prisma.user.count();
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  async upsertByEmail(email: string, data: CreateUserInput): Promise<User> {
    return prisma.user.upsert({
      where: { email },
      create: data,
      update: { name: data.name, avatarUrl: data.avatarUrl },
    });
  }
}

export const userRepository = new UserRepository();
