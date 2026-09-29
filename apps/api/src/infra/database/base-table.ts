import { sql } from 'drizzle-orm'
import { char, datetime } from 'drizzle-orm/mysql-core'

/** 所有表共有的字段。数据库真实结构仍由 SQL 管理。 */
export const coreColumns = () => ({
  id: char('id', { length: 36 }).primaryKey(),
  createdAt: datetime('created_at', { mode: 'string' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at', { mode: 'string' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow(),
})

/** 默认业务表字段，在 coreColumns 基础上支持软删除。 */
export const baseColumns = () => ({
  ...coreColumns(),
  deletedAt: datetime('deleted_at', { mode: 'string' }),
})
