import { createParamDecorator, SetMetadata } from '@nestjs/common'
import type { ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'
import { BusinessException, ResultCodeEnum } from '../../common/exceptions.js'
import type { UserRecord } from '../user/user.repository.js'

export const PUBLIC_ROUTE = 'auth:public'
export const SUPERUSER_ROUTE = 'auth:superuser'
export const Public = () => SetMetadata(PUBLIC_ROUTE, true)
export const RequireSuperuser = (required = true) => SetMetadata(SUPERUSER_ROUTE, required)

export interface AuthenticatedRequest extends Request {
  currentUser?: UserRecord
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserRecord => {
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().currentUser
    if (!user) throw new BusinessException(ResultCodeEnum.UNAUTHORIZED)
    return user
  },
)
