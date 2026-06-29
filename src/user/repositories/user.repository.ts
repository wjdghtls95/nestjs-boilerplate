import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Account, Provider, User } from '@prisma/client';
import { BaseRepository } from '@libs/common/repositories/base.repository';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class UserRepository extends BaseRepository {
  constructor(txHost: TransactionHost<TransactionalAdapterPrisma<DatabaseService>>) {
    super(txHost);
  }

  create(data: { email: string; name: string }): Promise<User> {
    return this.db.user.create({ data });
  }

  createWithGoogle(data: {
    email: string;
    name: string;
    providerId: string;
    googleAccessToken?: string;
    googleRefreshToken?: string;
  }): Promise<User> {
    return this.db.user.create({
      data: {
        email: data.email,
        name: data.name,
        accounts: {
          create: {
            provider: Provider.GOOGLE,
            providerId: data.providerId,
            ...(data.googleAccessToken && { googleAccessToken: data.googleAccessToken }),
            ...(data.googleRefreshToken && { googleRefreshToken: data.googleRefreshToken }),
          },
        },
      },
    });
  }

  // findFirst required because isDeleted is not a @unique field
  findById(id: string): Promise<User | null> {
    return this.db.user.findFirst({ where: { id, isDeleted: false } });
  }

  findByProvider(provider: Provider, providerId: string) {
    return this.db.account.findUnique({
      where: { provider_providerId: { provider, providerId } },
      include: { user: true },
    });
  }

  findGoogleAccount(userId: string): Promise<Account | null> {
    return this.db.account.findFirst({ where: { userId, provider: Provider.GOOGLE } });
  }

  update(id: string, data: Partial<Pick<User, 'name' | 'timezone' | 'locale'>>): Promise<User> {
    return this.db.user.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  hardDelete(id: string): Promise<User> {
    return this.db.user.delete({ where: { id } });
  }
}
