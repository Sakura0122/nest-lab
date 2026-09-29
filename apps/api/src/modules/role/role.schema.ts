import { char, mysqlTable, uniqueIndex, varchar } from 'drizzle-orm/mysql-core'
import { baseColumns, coreColumns } from '../../infra/database/base-table.js'

export const roles = mysqlTable(
  'roles',
  {
    ...baseColumns(),
    code: varchar('code', { length: 100 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 200 }),
  },
  (table) => [uniqueIndex('uq_roles_code').on(table.code)],
)

export const rolePermissions = mysqlTable('role_permissions', {
  ...coreColumns(),
  roleId: char('role_id', { length: 36 }).notNull(),
  permissionId: char('permission_id', { length: 36 }).notNull(),
})
