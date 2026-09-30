import { Injectable } from '@nestjs/common'
import { and, inArray, isNull } from 'drizzle-orm'
import type { DatabaseTransaction } from '../../infra/database/database.service.js'
import { roles } from './role.schema.js'

@Injectable()
export class RoleRepository {
  async findByIds(ids: string[], transaction: DatabaseTransaction) {
    if (!ids.length) return []
    return transaction
      .select()
      .from(roles)
      .where(and(inArray(roles.id, ids), isNull(roles.deletedAt)))
      .for('update')
  }
}
