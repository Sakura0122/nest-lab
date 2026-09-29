import { char, mysqlTable, tinyint, uniqueIndex, varchar } from 'drizzle-orm/mysql-core'
import { baseColumns } from '../../infra/database/base-table.js'

export const permissions = mysqlTable(
  'permissions',
  {
    ...baseColumns(),
    code: varchar('code', { length: 100 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    parentId: char('parent_id', { length: 36 }),
    type: tinyint('type').notNull(),
    description: varchar('description', { length: 200 }),
  },
  (table) => [uniqueIndex('uq_permissions_code').on(table.code)],
)
