export function validateEnvironment(environment: Record<string, unknown>): Record<string, unknown> {
  const databaseUrl = environment.DATABASE_URL
  if (typeof databaseUrl !== 'string' || !databaseUrl) {
    throw new Error('请配置 DATABASE_URL')
  }
  const parsed = new URL(databaseUrl)
  if (parsed.protocol !== 'mysql:' || !parsed.hostname || parsed.pathname.length <= 1) {
    throw new Error('DATABASE_URL 必须是包含数据库名的 MySQL 连接地址')
  }
  const secret = environment.JWT_SECRET
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) {
    throw new Error('JWT_SECRET 至少需要 32 字节，请使用随机生成的密钥')
  }
  return environment
}
