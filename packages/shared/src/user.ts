import type { PageRequest } from './page.js'
import type { RoleResponse } from './role.js'

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  isActive?: boolean
  isSuperuser?: boolean
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  password?: string
  isActive?: boolean
  isSuperuser?: boolean
}

export interface UserIdRequest {
  id: string
}

export type UserSortField = 'username' | 'email' | 'createdAt' | 'updatedAt'

export interface UserPageRequest extends PageRequest {
  sortField?: UserSortField
  isActive?: boolean
  isSuperuser?: boolean
}

export interface SetUserRolesRequest {
  roleIds: string[]
}

export interface UserResponse {
  id: string
  username: string
  email: string
  isActive: boolean
  isSuperuser: boolean
  lastLogin: string | null
  createdAt: string
  updatedAt: string
  roles: RoleResponse[]
}
