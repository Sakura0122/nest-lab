import { Injectable } from '@nestjs/common'
import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { BusinessException, ResultCodeEnum } from '../../common/exceptions.js'
import { PUBLIC_ROUTE, SUPERUSER_ROUTE } from './auth.decorators.js'
import type { AuthenticatedRequest } from './auth.decorators.js'
import { AuthService } from './auth.service.js'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()]
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, targets)) return true
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const authorization = request.headers.authorization
    const match = authorization?.match(/^Bearer ([^\s]+)$/i)
    const token = match?.[1]
    if (!token) throw new BusinessException(ResultCodeEnum.UNAUTHORIZED)
    const user = await this.authService.authenticate(token)
    if (this.reflector.getAllAndOverride<boolean>(SUPERUSER_ROUTE, targets) && !user.isSuperuser) {
      throw new BusinessException(ResultCodeEnum.NO_AUTH_ERROR)
    }
    request.currentUser = user
    return true
  }
}
