import { boolean, char, datetime, mysqlTable, uniqueIndex, varchar } from 'drizzle-orm/mysql-core'
import { baseColumns, coreColumns } from '../../infra/database/base-table.js'

export const users = mysqlTable(
  'users',
  {
    ...baseColumns(),
    username: varchar('username', { length: 50 }).notNull(),
    email: varchar('email', { length: 100 }).notNull(),
    hashedPassword: varchar('hashed_password', { length: 255 }).notNull(),
    isActive: boolean('is_active').notNull(),
    isSuperuser: boolean('is_superuser').notNull(),
    lastLogin: datetime('last_login', { mode: 'string' }),
  },
  (table) => [
    uniqueIndex('ix_users_email').on(table.email),
    uniqueIndex('ix_users_username').on(table.username),
  ],
)

export const userRoles = mysqlTable('user_roles', {
  ...coreColumns(),
  userId: char('user_id', { length: 36 }).notNull(),
  roleId: char('role_id', { length: 36 }).notNull(),
})
