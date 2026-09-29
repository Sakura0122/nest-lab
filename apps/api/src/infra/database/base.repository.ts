import { and, asc, count, eq, isNull, like, or, sql } from 'drizzle-orm'
import type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm'
import type { AnyMySqlTable } from 'drizzle-orm/mysql-core'

type Database = {
  select: (...args: any[]) => any
  insert: (...args: any[]) => any
  update: (...args: any[]) => any
  delete: (...args: any[]) => any
}

type Row<T extends AnyMySqlTable> = InferSelectModel<T>
type Insert<T extends AnyMySqlTable> = InferInsertModel<T>
type RepositoryOptions = { includeDeleted?: boolean }

/** 提供基础数据库操作；事务提交和业务异常由上层负责。 */
export class BaseRepository<T extends AnyMySqlTable> {
  constructor(
    protected readonly table: T,
    protected readonly db: Database,
  ) {}

  private get idColumn() {
    return (this.table as any).id
  }

  private get deletedAtColumn() {
    return (this.table as any).deletedAt
  }

  /**
   * 生成“默认排除软删除记录”的查询条件
   * @param includeDeleted 是否查询已删除记录
   * @private
   */
  private activeCondition(includeDeleted: boolean) {
    return includeDeleted || !this.deletedAtColumn ? undefined : isNull(this.deletedAtColumn)
  }

  async get(conditions: SQL[] = [], options: RepositoryOptions = {}): Promise<Row<T> | undefined> {
    const where = [this.activeCondition(options.includeDeleted ?? false), ...conditions].filter(
      (condition): condition is SQL => condition !== undefined,
    )
    const rows = await this.db
      .select()
      .from(this.table)
      .where(and(...where))
      .limit(1)
    return rows[0]
  }

  async getById(id: string, options: RepositoryOptions = {}): Promise<Row<T> | undefined> {
    return this.get([eq(this.idColumn, id)], options)
  }

  async getList(conditions: SQL[] = [], options: RepositoryOptions = {}): Promise<Row<T>[]> {
    const where = [this.activeCondition(options.includeDeleted ?? false), ...conditions].filter(
      (condition): condition is SQL => condition !== undefined,
    )
    return this.db
      .select()
      .from(this.table)
      .where(and(...where))
      .orderBy(asc(this.idColumn))
  }

  async getAll(options: RepositoryOptions = {}): Promise<Row<T>[]> {
    return this.getList([], options)
  }

  async count(conditions: SQL[] = [], options: RepositoryOptions = {}): Promise<number> {
    const where = [this.activeCondition(options.includeDeleted ?? false), ...conditions].filter(
      (condition): condition is SQL => condition !== undefined,
    )
    const rows = await this.db
      .select({ count: count(this.idColumn) })
      .from(this.table)
      .where(and(...where))
    return Number(rows[0]?.count ?? 0)
  }

  async exists(conditions: SQL[] = [], options: RepositoryOptions = {}): Promise<boolean> {
    return (await this.count(conditions, options)) > 0
  }

  async create(data: Insert<T>): Promise<Row<T>> {
    await this.db.insert(this.table).values(data)
    const id = (data as any).id
    const created = await this.getById(id, { includeDeleted: true })
    if (!created) throw new Error('创建记录后无法查询记录')
    return created
  }

  async update(id: string, data: Partial<Insert<T>>): Promise<Row<T> | undefined> {
    await this.db.update(this.table).set(data).where(eq(this.idColumn, id))
    return this.getById(id, { includeDeleted: true })
  }

  async delete(ids: string[]): Promise<void> {
    if (!ids.length) return
    const condition = sql`${this.idColumn} in (${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )})`
    if (this.deletedAtColumn) {
      await this.db
        .update(this.table)
        .set({ deletedAt: sql`CURRENT_TIMESTAMP` })
        .where(and(condition, isNull(this.deletedAtColumn)))
    } else {
      await this.db.delete(this.table).where(condition)
    }
  }

  async restore(ids: string[]): Promise<void> {
    if (!this.deletedAtColumn) throw new TypeError('该表不支持软删除恢复')
    if (!ids.length) return
    const condition = sql`${this.idColumn} in (${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )})`
    await this.db.update(this.table).set({ deletedAt: null }).where(condition)
  }

  async getPage(
    offset = 0,
    limit = 20,
    keyword?: string,
    searchFields: string[] = [],
    options: RepositoryOptions = {},
  ) {
    const searchConditions = keyword
      ? searchFields.map((field) => {
          const column = (this.table as any)[field]
          if (!column) throw new Error(`表中不存在字段: ${field}`)
          return like(column, `%${keyword}%`)
        })
      : []
    const where = [
      this.activeCondition(options.includeDeleted ?? false),
      searchConditions.length ? or(...searchConditions) : undefined,
    ].filter((condition): condition is SQL => condition !== undefined)
    const [rows, total] = await Promise.all([
      this.db
        .select()
        .from(this.table)
        .where(and(...where))
        .orderBy(asc(this.idColumn))
        .offset(offset)
        .limit(limit),
      this.db
        .select({ count: count(this.idColumn) })
        .from(this.table)
        .where(and(...where)),
    ])
    return { rows, total: Number(total[0]?.count ?? 0) }
  }
}
