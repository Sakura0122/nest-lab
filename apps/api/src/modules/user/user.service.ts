import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type {
  CreateUserRequest,
  SetUserRolesRequest,
  UpdateUserRequest,
  UserResponse,
} from 'shared/user'
import type { RoleResponse } from 'shared/role'
import { BusinessException, ResultCodeEnum } from '../../common/exceptions.js'
import { PageResult } from '../../common/page.js'
import { PasswordService } from '../../infra/security/password.service.js'
import { DatabaseService } from '../../infra/database/database.service.js'
import type { DatabaseExecutor } from '../../infra/database/database.service.js'
import { RoleRepository } from '../role/role.repository.js'
import type { UserPageDto } from './user.dto.js'
import { UserRepository } from './user.repository.js'
import type { UserRecord } from './user.repository.js'

function isDuplicateEntry(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (('code' in error && error.code === 'ER_DUP_ENTRY') ||
      ('cause' in error && isDuplicateEntry(error.cause)))
  )
}

@Injectable()
export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly passwordService: PasswordService,
    private readonly database: DatabaseService,
  ) {}

  async create(request: CreateUserRequest): Promise<UserResponse> {
    // 1. 校验用户名和邮箱唯一性，软删除记录仍占用唯一索引
    if (await this.repository.hasIdentityConflict(request.username, request.email)) {
      throw new BusinessException(ResultCodeEnum.CONFLICT, '用户名或邮箱已存在')
    }

    // 2. 哈希密码并保存用户，不在响应中暴露密码信息
    const hashedPassword = await this.passwordService.hash(request.password)
    const id = randomUUID()
    try {
      return await this.database.db.transaction(async (transaction) => {
        await this.repository.create(
          {
            id,
            username: request.username,
            email: request.email,
            hashedPassword,
            isActive: request.isActive ?? true,
            isSuperuser: request.isSuperuser ?? false,
          },
          transaction,
        )
        return this.getDetail(id, transaction)
      })
    } catch (error) {
      if (isDuplicateEntry(error))
        throw new BusinessException(ResultCodeEnum.CONFLICT, '用户名或邮箱已存在')
      throw error
    }
  }

  async update(id: string, request: UpdateUserRequest, actorId: string): Promise<UserResponse> {
    // 1. 准备密码哈希，避免在持有数据库行锁时执行耗时计算
    const hashedPassword =
      request.password === undefined ? undefined : await this.passwordService.hash(request.password)

    // 2. 锁定用户，校验唯一性并防止管理员停用或降级自己
    try {
      return await this.database.db.transaction(async (transaction) => {
        const user = this.requireUser(id, await this.repository.findByIdForUpdate(id, transaction))
        if (user.id === actorId && (request.isActive === false || request.isSuperuser === false)) {
          throw new BusinessException(
            ResultCodeEnum.NO_AUTH_ERROR,
            '不能停用自己或取消自己的超级管理员身份',
          )
        }
        if (
          await this.repository.hasIdentityConflict(
            request.username,
            request.email,
            user.id,
            transaction,
          )
        ) {
          throw new BusinessException(ResultCodeEnum.CONFLICT, '用户名或邮箱已存在')
        }

        // 3. 仅更新明确提供的字段
        const changes = {
          username: request.username,
          email: request.email,
          hashedPassword,
          isActive: request.isActive,
          isSuperuser: request.isSuperuser,
        }
        if (Object.values(changes).some((value) => value !== undefined)) {
          await this.repository.update(user.id, changes, transaction)
        }
        return this.getDetail(user.id, transaction)
      })
    } catch (error) {
      if (isDuplicateEntry(error))
        throw new BusinessException(ResultCodeEnum.CONFLICT, '用户名或邮箱已存在')
      throw error
    }
  }

  async delete(id: string, actorId: string): Promise<void> {
    // 1. 锁定目标用户，防止管理员删除自己
    await this.database.db.transaction(async (transaction) => {
      const user = this.requireUser(id, await this.repository.findByIdForUpdate(id, transaction))
      if (user.id === actorId)
        throw new BusinessException(ResultCodeEnum.NO_AUTH_ERROR, '不能删除当前登录用户')

      // 2. 在同一事务中软删除用户并清理角色关联
      await this.repository.delete(user.id, transaction)
    })
  }

  async getPage(page: UserPageDto): Promise<PageResult<UserResponse>> {
    // 1. 查询符合条件的用户及总数
    const { list, total } = await this.repository.getPage(page)

    // 2. 批量加载角色，避免逐个用户查询
    const userRoles = await this.repository.getRoles(list.map((user) => user.id))
    const rolesByUser = new Map<string, RoleResponse[]>()
    for (const role of userRoles) {
      const current = rolesByUser.get(role.userId) ?? []
      current.push({ id: role.id, code: role.code, name: role.name, description: role.description })
      rolesByUser.set(role.userId, current)
    }
    return PageResult.of(
      page,
      total,
      list.map((user) => this.toResponse(user, rolesByUser.get(user.id) ?? [])),
    )
  }

  async getDetail(id: string, executor?: DatabaseExecutor): Promise<UserResponse> {
    const user = this.requireUser(id, await this.repository.findById(id, executor))
    const roles = await this.repository.getRoles([id], executor)
    return this.toResponse(
      user,
      roles.map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
      })),
    )
  }

  async setRoles(id: string, request: SetUserRolesRequest): Promise<UserResponse> {
    // 1. 锁定用户及角色，校验所有角色存在且未删除
    return this.database.db.transaction(async (transaction) => {
      const user = this.requireUser(id, await this.repository.findByIdForUpdate(id, transaction))
      const roles = await this.roleRepository.findByIds(request.roleIds, transaction)
      if (roles.length !== request.roleIds.length) {
        throw new BusinessException(ResultCodeEnum.NOT_FOUND_ERROR, '部分角色不存在或已删除')
      }

      // 2. 在同一事务中全量替换角色关联，空数组表示清空角色
      await this.repository.replaceRoles(
        user.id,
        roles.map((role) => ({ id: randomUUID(), userId: user.id, roleId: role.id })),
        transaction,
      )
      return this.getDetail(user.id, transaction)
    })
  }

  private requireUser(id: string, user: UserRecord | undefined): UserRecord {
    if (!user) throw new BusinessException(ResultCodeEnum.NOT_FOUND_ERROR, `用户 ${id} 不存在`)
    return user
  }

  private toResponse(user: UserRecord, roles: RoleResponse[]): UserResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isActive: user.isActive,
      isSuperuser: user.isSuperuser,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles,
    }
  }
}
