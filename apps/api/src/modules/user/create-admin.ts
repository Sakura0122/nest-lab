import 'reflect-metadata'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { plainToInstance } from 'class-transformer'
import { validateOrReject } from 'class-validator'
import { AppModule } from '../../app.module.js'
import { CreateUserDto } from './user.dto.js'
import { UserService } from './user.service.js'

async function createAdmin(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule)
  try {
    const config = app.get(ConfigService)
    const request = plainToInstance(CreateUserDto, {
      username: config.getOrThrow<string>('ADMIN_USERNAME'),
      email: config.getOrThrow<string>('ADMIN_EMAIL'),
      password: config.getOrThrow<string>('ADMIN_PASSWORD'),
      isActive: true,
      isSuperuser: true,
    })
    await validateOrReject(request)
    const user = await app.get(UserService).create(request)
    console.log(`已创建超级管理员：${user.username} (${user.id})`)
  } finally {
    await app.close()
  }
}

try {
  await createAdmin()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
