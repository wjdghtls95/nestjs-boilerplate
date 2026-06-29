import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { RefreshToken } from '@prisma/client';
import { BaseRepository } from '@libs/common/repositories/base.repository';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class RefreshTokenRepository extends BaseRepository {
  constructor(txHost: TransactionHost<TransactionalAdapterPrisma<DatabaseService>>) {
    super(txHost);
  }

  create(data: { userId: string; token: string; expiresAt: Date }): Promise<RefreshToken> {
    return this.db.refreshToken.create({ data });
  }

  // delete-first 패턴: TOCTOU 없이 원자적으로 삭제하고 레코드 반환
  deleteAndReturn(token: string): Promise<RefreshToken> {
    return this.db.refreshToken.delete({ where: { token } });
  }

  deleteByToken(token: string) {
    return this.db.refreshToken.deleteMany({ where: { token } });
  }

  deleteByUserId(userId: string) {
    return this.db.refreshToken.deleteMany({ where: { userId } });
  }
}
