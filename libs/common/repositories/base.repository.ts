import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { DatabaseService } from '../../../src/database/database.service';

export abstract class BaseRepository {
  constructor(
    protected readonly txHost: TransactionHost<TransactionalAdapterPrisma<DatabaseService>>,
  ) {}

  protected get db(): DatabaseService {
    return this.txHost.tx as DatabaseService;
  }
}
