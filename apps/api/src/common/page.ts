import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsBoolean, IsInt, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator'
import type { PageRequest as PageRequestContract, PageResponse } from 'shared/page'

export class PageRequest implements PageRequestContract {
  @ApiPropertyOptional({ description: '当前页码', default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  currentPage = 1

  @ApiPropertyOptional({ description: '每页条数', default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20

  @ApiPropertyOptional({ description: '搜索关键词', maxLength: 100 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(100)
  keyword?: string

  @ApiPropertyOptional({ description: '排序字段' })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  sortField?: string

  @ApiPropertyOptional({ description: '是否升序', default: true })
  @IsBoolean()
  isAsc = true

  get offset(): number {
    return (this.currentPage - 1) * this.pageSize
  }
}

export class PageResult<T> implements PageResponse<T> {
  constructor(
    readonly total: number,
    readonly pageCount: number,
    readonly list: T[],
  ) {}

  static of<T>(page: PageRequest, total: number, items: T[]): PageResult<T> {
    return new PageResult(total, Math.ceil(total / page.pageSize), items)
  }
}
