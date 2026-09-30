import { Module } from '@nestjs/common'
import { PasswordService } from '../../infra/security/password.service.js'
import { DatabaseModule } from '../../infra/database/database.module.js'
import { RoleRepository } from '../role/role.repository.js'
import { UserController } from './user.controller.js'
import { UserRepository } from './user.repository.js'
import { UserService } from './user.service.js'

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService, UserRepository, RoleRepository, PasswordService],
  exports: [UserService, UserRepository, PasswordService],
})
export class UserModule {}
