import { Injectable } from '@nestjs/common'
import type { OnApplicationShutdown } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle } from 'drizzle-orm/mysql2'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import { createPool } from 'mysql2'
import type { Pool } from 'mysql2'

export type DatabaseTransaction = Parameters<Parameters<MySql2Database['transaction']>[0]>[0]
export type DatabaseExecutor = MySql2Database | DatabaseTransaction

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly pool: Pool
  readonly db: MySql2Database

  constructor(config: ConfigService) {
    this.pool = createPool({
      uri: config.getOrThrow<string>('DATABASE_URL'),
      connectionLimit: 10,
      supportBigNumbers: true,
    })
    this.db = drizzle({ client: this.pool })
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.promise().end()
  }
}
