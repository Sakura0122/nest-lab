import { ApiProperty } from '@nestjs/swagger'
import type { RoleResponse } from 'shared/role'

export class RoleResponseDto implements RoleResponse {
  @ApiProperty({ description: '角色 UUID', format: 'uuid' })
  id: string

  @ApiProperty({ description: '角色编码' })
  code: string

  @ApiProperty({ description: '角色名称' })
  name: string

  @ApiProperty({ description: '角色描述', type: String, nullable: true })
  description: string | null
}
