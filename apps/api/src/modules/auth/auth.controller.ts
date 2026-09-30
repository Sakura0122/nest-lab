import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { LoginResponse } from 'shared/auth'
import { ApiResultResponse } from '../../common/api-result.decorator.js'
import { Result } from '../../common/result.js'
import { Public } from './auth.decorators.js'
import { LoginDto, LoginResponseDto } from './auth.dto.js'
import { AuthService } from './auth.service.js'

@ApiTags('登录认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  @ApiResultResponse(LoginResponseDto)
  async login(@Body() request: LoginDto): Promise<Result<LoginResponse>> {
    return Result.success(await this.service.login(request))
  }
}
