import { Module, ValidationPipe } from '@nestjs/common'
import { APP_FILTER, APP_PIPE } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { GlobalExceptionFilter } from './core/global-exception.filter.js'
import { validateEnvironment } from './core/environment.js'
import { AuthModule } from './modules/auth/auth.module.js'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }), AuthModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ transform: true, whitelist: true }),
    },
  ],
})
export class AppModule {}
