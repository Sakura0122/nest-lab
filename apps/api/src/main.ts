import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { createLogger } from './core/logger.js'
import { setupSwagger } from './core/swagger.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: createLogger() })
  app.enableShutdownHooks()
  setupSwagger(app)
  await app.listen(process.env.PORT ?? 3000)
}
await bootstrap()
