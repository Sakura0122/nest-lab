import { applyDecorators } from '@nestjs/common'
import type { Type } from '@nestjs/common'
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger'

export function ApiResultResponse(model?: Type<unknown>, paginated = false) {
  const data = model
    ? paginated
      ? {
          type: 'object',
          required: ['total', 'pageCount', 'list'],
          properties: {
            total: { type: 'integer', description: '总记录数' },
            pageCount: { type: 'integer', description: '总页数' },
            list: {
              type: 'array',
              description: '当前页数据',
              items: { $ref: getSchemaPath(model) },
            },
          },
        }
      : { $ref: getSchemaPath(model) }
    : { nullable: true, example: null }

  return applyDecorators(
    ApiExtraModels(...(model ? [model] : [])),
    ApiOkResponse({
      schema: {
        type: 'object',
        required: ['code', 'message', 'data'],
        properties: {
          code: { type: 'integer', description: '业务状态码', example: 200 },
          message: { type: 'string', description: '处理结果说明', example: '成功' },
          data,
        },
      },
    }),
  )
}
