import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { isUUID } from 'class-validator'
import { createHash } from 'node:crypto'
import type { LoginRequest, LoginResponse } from 'shared/auth'
import { BusinessException, ResultCodeEnum } from '../../common/exceptions.js'
import { PasswordService } from '../../infra/security/password.service.js'
import { UserRepository } from '../user/user.repository.js'
import type { UserRecord } from '../user/user.repository.js'
import { UserService } from '../user/user.service.js'

export const ACCESS_TOKEN_TTL_SECONDS = 3600
const dummyPasswordHash = `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`

function passwordVersion(user: UserRecord): string {
  return createHash('sha256').update(user.hashedPassword).digest('hex')
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: UserRepository,
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async login(request: LoginRequest): Promise<LoginResponse> {
    // 1. 验证凭据，统一隐藏用户不存在、停用和密码错误的区别
    const user = await this.repository.findByUsername(request.username)
    const matches = await this.passwordService.verify(
      request.password,
      user?.hashedPassword ?? dummyPasswordHash,
    )
    if (!user || !user.isActive || !matches) {
      throw new BusinessException(ResultCodeEnum.UNAUTHORIZED, '用户名或密码错误，或用户已停用')
    }

    // 2. 记录登录时间并签发访问令牌
    await this.repository.updateLastLogin(user.id)
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      passwordVersion: passwordVersion(user),
    })
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: await this.userService.getDetail(user.id),
    }
  }

  async authenticate(token: string): Promise<UserRecord> {
    // 1. 验证签名、过期时间及令牌用途
    let payload: unknown
    try {
      payload = await this.jwtService.verifyAsync<Record<string, unknown>>(token, {
        algorithms: ['HS256'],
        issuer: 'nest-lab',
        audience: 'nest-lab-web',
      })
    } catch {
      throw new BusinessException(ResultCodeEnum.UNAUTHORIZED, '登录已失效，请重新登录')
    }
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('sub' in payload) ||
      typeof payload.sub !== 'string' ||
      !isUUID(payload.sub, '4') ||
      !('passwordVersion' in payload) ||
      typeof payload.passwordVersion !== 'string' ||
      !('exp' in payload) ||
      typeof payload.exp !== 'number'
    ) {
      throw new BusinessException(ResultCodeEnum.UNAUTHORIZED, '登录已失效，请重新登录')
    }

    // 2. 读取最新用户状态，停用、删除或修改密码后旧令牌失效
    const user = await this.repository.findById(payload.sub)
    if (!user || !user.isActive || passwordVersion(user) !== payload.passwordVersion) {
      throw new BusinessException(ResultCodeEnum.UNAUTHORIZED, '登录已失效，请重新登录')
    }
    return user
  }
}
