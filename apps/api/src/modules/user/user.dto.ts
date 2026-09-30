import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator'
import type {
  CreateUserRequest,
  SetUserRolesRequest,
  UpdateUserRequest,
  UserIdRequest,
  UserPageRequest,
  UserResponse,
  UserSortField,
} from 'shared/user'
import { PageRequest } from '../../common/page.js'
import { RoleResponseDto } from '../role/role.dto.js'

export class CreateUserDto implements CreateUserRequest {
  @ApiProperty({
    description: '用户名，仅允许字母、数字、下划线、点和连字符',
    minLength: 3,
    maxLength: 50,
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 50)
  @Matches(/^[a-zA-Z0-9_.-]+$/)
  username: string

  @ApiProperty({ description: '邮箱', maxLength: 100 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(100)
  email: string

  @ApiProperty({
    description: '密码，12 至 128 个字符',
    minLength: 12,
    maxLength: 128,
    writeOnly: true,
  })
  @IsString()
  @Length(12, 128)
  password: string

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional({ description: '是否为超级管理员', default: false })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  isSuperuser?: boolean
}

export class UpdateUserDto
  extends PartialType(CreateUserDto, { skipNullProperties: false })
  implements UpdateUserRequest {}

export class UserIdDto implements UserIdRequest {
  @ApiProperty({ description: '用户 UUID', format: 'uuid' })
  @IsUUID('4')
  id: string
}

export class UserPageDto extends PageRequest implements UserPageRequest {
  @ApiPropertyOptional({
    description: '排序字段',
    enum: ['username', 'email', 'createdAt', 'updatedAt'],
    default: 'createdAt',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsIn(['username', 'email', 'createdAt', 'updatedAt'])
  declare sortField?: UserSortField

  @ApiPropertyOptional({ description: '按启用状态筛选' })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional({ description: '按超级管理员状态筛选' })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  isSuperuser?: boolean
}

export class SetUserRolesDto implements SetUserRolesRequest {
  @ApiProperty({
    description: '完整角色 UUID 列表，空数组表示清空角色',
    type: [String],
    maxItems: 100,
  })
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  roleIds: string[]
}

export class UserResponseDto implements UserResponse {
  @ApiProperty({ description: '用户 UUID', format: 'uuid' })
  id: string

  @ApiProperty({ description: '用户名' })
  username: string

  @ApiProperty({ description: '邮箱' })
  email: string

  @ApiProperty({ description: '是否启用' })
  isActive: boolean

  @ApiProperty({ description: '是否为超级管理员' })
  isSuperuser: boolean

  @ApiProperty({ description: '最后登录时间', type: String, nullable: true })
  lastLogin: string | null

  @ApiProperty({ description: '创建时间' })
  createdAt: string

  @ApiProperty({ description: '更新时间' })
  updatedAt: string

  @ApiProperty({ description: '用户角色', type: [RoleResponseDto] })
  roles: RoleResponseDto[]
}
