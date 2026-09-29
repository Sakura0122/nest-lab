export const ResultCode = {
  PARAM_ERROR: 400,
  UNAUTHORIZED: 401,
  NO_AUTH_ERROR: 403,
  NOT_FOUND_ERROR: 404,
  CONFLICT: 409,
  SYSTEM_ERROR: 500,
}
type ResultCode = (typeof ResultCode)[keyof typeof ResultCode]

export const resultCodeMessages: Record<number, string> = {
  [ResultCode.PARAM_ERROR]: '请求参数错误',
  [ResultCode.UNAUTHORIZED]: '请先登录',
  [ResultCode.NO_AUTH_ERROR]: '无权限',
  [ResultCode.NOT_FOUND_ERROR]: '请求数据不存在',
  [ResultCode.CONFLICT]: '资源已存在',
  [ResultCode.SYSTEM_ERROR]: '系统错误',
}

export const ResultCodeEnum = {
  PARAM_ERROR: {
    code: ResultCode.PARAM_ERROR,
    message: resultCodeMessages[ResultCode.PARAM_ERROR],
  },
  UNAUTHORIZED: {
    code: ResultCode.UNAUTHORIZED,
    message: resultCodeMessages[ResultCode.UNAUTHORIZED],
  },
  NO_AUTH_ERROR: {
    code: ResultCode.NO_AUTH_ERROR,
    message: resultCodeMessages[ResultCode.NO_AUTH_ERROR],
  },
  NOT_FOUND_ERROR: {
    code: ResultCode.NOT_FOUND_ERROR,
    message: resultCodeMessages[ResultCode.NOT_FOUND_ERROR],
  },
  CONFLICT: { code: ResultCode.CONFLICT, message: resultCodeMessages[ResultCode.CONFLICT] },
  SYSTEM_ERROR: {
    code: ResultCode.SYSTEM_ERROR,
    message: resultCodeMessages[ResultCode.SYSTEM_ERROR],
  },
} as const

export type ResultCodeEnum = (typeof ResultCodeEnum)[keyof typeof ResultCodeEnum]

export class BusinessException extends Error {
  constructor(code: number | ResultCodeEnum, message?: string) {
    const result = typeof code === 'number' ? { code, message: resultCodeMessages[code] } : code
    super(message ?? result.message ?? '请求处理失败')
    this.code = result.code
  }

  readonly code: number
}
