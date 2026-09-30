import { Body, Controller, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import type { UserResponse } from 'shared/user'
import { ApiResultResponse } from '../../common/api-result.decorator.js'
import { PageResult } from '../../common/page.js'
import { Result } from '../../common/result.js'
import { CurrentUser, RequireSuperuser } from '../auth/auth.decorators.js'
import {
  CreateUserDto,
  SetUserRolesDto,
  UpdateUserDto,
  UserIdDto,
  UserPageDto,
  UserResponseDto,
} from './user.dto.js'
import type { UserRecord } from './user.repository.js'
import { UserService } from './user.service.js'

@ApiTags('用户管理')
@ApiBearerAuth()
@RequireSuperuser()
@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post('create')
  @ApiOperation({ summary: '创建用户' })
  @ApiResultResponse(UserResponseDto)
  async create(@Body() request: CreateUserDto): Promise<Result<UserResponse>> {
    return Result.success(await this.service.create(request))
  }

  @Post(':id/update')
  @ApiOperation({ summary: '编辑用户信息' })
  @ApiParam({ name: 'id', description: '用户 UUID', format: 'uuid' })
  @ApiResultResponse(UserResponseDto)
  async update(
    @Param() params: UserIdDto,
    @Body() request: UpdateUserDto,
    @CurrentUser() actor: UserRecord,
  ): Promise<Result<UserResponse>> {
    return Result.success(await this.service.update(params.id, request, actor.id))
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', description: '用户 UUID', format: 'uuid' })
  @ApiResultResponse()
  async delete(
    @Param() params: UserIdDto,
    @CurrentUser() actor: UserRecord,
  ): Promise<Result<null>> {
    await this.service.delete(params.id, actor.id)
    return Result.success(null)
  }

  @Post('page')
  @ApiOperation({ summary: '分页查询用户列表' })
  @ApiResultResponse(UserResponseDto, true)
  async getPage(@Body() request: UserPageDto): Promise<Result<PageResult<UserResponse>>> {
    return Result.success(await this.service.getPage(request))
  }

  @Post('me')
  @RequireSuperuser(false)
  @ApiOperation({ summary: '获取当前登录用户信息' })
  @ApiResultResponse(UserResponseDto)
  async getCurrentUser(@CurrentUser() user: UserRecord): Promise<Result<UserResponse>> {
    return Result.success(await this.service.getDetail(user.id))
  }

  @Post(':id/detail')
  @ApiOperation({ summary: '获取用户详情' })
  @ApiParam({ name: 'id', description: '用户 UUID', format: 'uuid' })
  @ApiResultResponse(UserResponseDto)
  async getDetail(@Param() params: UserIdDto): Promise<Result<UserResponse>> {
    return Result.success(await this.service.getDetail(params.id))
  }

  @Post(':id/roles')
  @ApiOperation({ summary: '设置用户角色' })
  @ApiParam({ name: 'id', description: '用户 UUID', format: 'uuid' })
  @ApiResultResponse(UserResponseDto)
  async setRoles(
    @Param() params: UserIdDto,
    @Body() request: SetUserRolesDto,
  ): Promise<Result<UserResponse>> {
    return Result.success(await this.service.setRoles(params.id, request))
  }
}
