import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common'
import type { ExceptionFilter } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { BusinessException, ResultCode, resultCodeMessages } from '../common/exceptions.js'
import { Result } from '../common/result.js'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    let code: number = ResultCode.SYSTEM_ERROR
    let message = resultCodeMessages[ResultCode.SYSTEM_ERROR]

    if (exception instanceof BusinessException) {
      code = exception.code
      message = exception.message
    } else if (exception instanceof HttpException) {
      code = exception.getStatus()
      const response = exception.getResponse()
      if (typeof response === 'string') {
        message = response
      } else if ('message' in response) {
        const detail: unknown = response.message
        message = Array.isArray(detail)
          ? detail.join(', ')
          : typeof detail === 'string'
            ? detail
            : exception.message
      } else {
        message = exception.message
      }
    } else {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      )
    }

    this.httpAdapterHost.httpAdapter.reply(
      host.switchToHttp().getResponse(),
      Result.error(code, message),
      HttpStatus.OK,
    )
  }
}
