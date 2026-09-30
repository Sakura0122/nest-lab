import { Injectable } from '@nestjs/common'
import { and, asc, count, desc, eq, inArray, isNull, like, ne, or, sql } from 'drizzle-orm'
import { DatabaseService } from '../../infra/database/database.service.js'
import type {
  DatabaseExecutor,
  DatabaseTransaction,
} from '../../infra/database/database.service.js'
import { roles } from '../role/role.schema.js'
import type { UserPageDto } from './user.dto.js'
import { userRoles, users } from './user.schema.js'

export type UserRecord = typeof users.$inferSelect
type UserInsert = typeof users.$inferInsert

@Injectable()
export class UserRepository {
  constructor(private readonly database: DatabaseService) {}

  async findById(
    id: string,
    executor: DatabaseExecutor = this.database.db,
  ): Promise<UserRecord | undefined> {
    const [user] = await executor
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1)
    return user
  }

  async findByIdForUpdate(
    id: string,
    transaction: DatabaseTransaction,
  ): Promise<UserRecord | undefined> {
    const [user] = await transaction
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1)
      .for('update')
    return user
  }

  async findByUsername(username: string): Promise<UserRecord | undefined> {
    const [user] = await this.database.db
      .select()
      .from(users)
      .where(and(eq(users.username, username), isNull(users.deletedAt)))
      .limit(1)
    return user
  }

  async hasIdentityConflict(
    username?: string,
    email?: string,
    excludeId?: string,
    executor: DatabaseExecutor = this.database.db,
  ): Promise<boolean> {
    if (username === undefined && email === undefined) return false
    const [existing] = await executor
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          or(
            username === undefined ? undefined : eq(users.username, username),
            email === undefined ? undefined : eq(users.email, email),
          ),
          excludeId ? ne(users.id, excludeId) : undefined,
        ),
      )
      .limit(1)
    return existing !== undefined
  }

  async create(data: UserInsert, transaction: DatabaseTransaction): Promise<void> {
    await transaction.insert(users).values(data)
  }

  async update(
    id: string,
    data: Partial<
      Pick<UserInsert, 'username' | 'email' | 'hashedPassword' | 'isActive' | 'isSuperuser'>
    >,
    transaction: DatabaseTransaction,
  ): Promise<void> {
    await transaction
      .update(users)
      .set(data)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
  }

  async delete(id: string, transaction: DatabaseTransaction): Promise<void> {
    await transaction
      .update(users)
      .set({ deletedAt: sql`CURRENT_TIMESTAMP`, isActive: false })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
    await transaction.delete(userRoles).where(eq(userRoles.userId, id))
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.database.db
      .update(users)
      .set({ lastLogin: sql`CURRENT_TIMESTAMP` })
      .where(and(eq(users.id, id), isNull(users.deletedAt), eq(users.isActive, true)))
  }

  async getPage(page: UserPageDto) {
    const keyword = page.keyword?.replace(/[\\%_]/g, '\\$&')
    const condition = and(
      isNull(users.deletedAt),
      keyword
        ? or(like(users.username, `%${keyword}%`), like(users.email, `%${keyword}%`))
        : undefined,
      page.isActive === undefined ? undefined : eq(users.isActive, page.isActive),
      page.isSuperuser === undefined ? undefined : eq(users.isSuperuser, page.isSuperuser),
    )
    const sortFields = {
      username: users.username,
      email: users.email,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }
    const sortColumn = sortFields[page.sortField ?? 'createdAt']
    const [list, totals] = await Promise.all([
      this.database.db
        .select()
        .from(users)
        .where(condition)
        .orderBy(page.isAsc ? asc(sortColumn) : desc(sortColumn), asc(users.id))
        .offset(page.offset)
        .limit(page.pageSize),
      this.database.db.select({ total: count() }).from(users).where(condition),
    ])
    return { list, total: Number(totals[0]?.total ?? 0) }
  }

  async getRoles(userIds: string[], executor: DatabaseExecutor = this.database.db) {
    if (!userIds.length) return []
    return executor
      .select({
        userId: userRoles.userId,
        id: roles.id,
        code: roles.code,
        name: roles.name,
        description: roles.description,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(inArray(userRoles.userId, userIds), isNull(roles.deletedAt)))
      .orderBy(asc(roles.code))
  }

  async replaceRoles(
    userId: string,
    records: (typeof userRoles.$inferInsert)[],
    transaction: DatabaseTransaction,
  ): Promise<void> {
    await transaction.delete(userRoles).where(eq(userRoles.userId, userId))
    if (records.length) await transaction.insert(userRoles).values(records)
  }
}
