export class Result<T> {
  private constructor(
    readonly code: number,
    readonly message: string,
    readonly data: T | null,
  ) {}

  static success<T>(data: T | null = null): Result<T> {
    return new Result(200, '成功', data)
  }

  static error(code: number, message: string): Result<null> {
    return new Result(code, message, null)
  }
}
