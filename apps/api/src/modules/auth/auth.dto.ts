import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsString, Length } from 'class-validator'
import type { LoginRequest, LoginResponse } from 'shared/auth'
import { UserResponseDto } from '../user/user.dto.js'

export class LoginDto implements LoginRequest {
  @ApiProperty({ description: '用户名', minLength: 3, maxLength: 50 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 50)
  username: string

  @ApiProperty({ description: '密码', minLength: 12, maxLength: 128, writeOnly: true })
  @IsString()
  @Length(12, 128)
  password: string
}

export class LoginResponseDto implements LoginResponse {
  @ApiProperty({ description: '访问令牌' })
  accessToken: string

  @ApiProperty({ description: '令牌类型', enum: ['Bearer'] })
  tokenType: 'Bearer'

  @ApiProperty({ description: '令牌有效期，单位秒', example: 3600 })
  expiresIn: number

  @ApiProperty({ description: '当前用户信息', type: UserResponseDto })
  user: UserResponseDto
}
