import { Injectable } from '@nestjs/common'
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

@Injectable()
export class PasswordService {
  private derive(password: string, salt: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(
        password,
        salt,
        64,
        { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 },
        (error, key) => {
          if (error) reject(error)
          else resolve(key)
        },
      )
    })
  }

  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex')
    const key = await this.derive(password, salt)
    return `scrypt$${salt}$${key.toString('hex')}`
  }

  async verify(password: string, hashedPassword: string): Promise<boolean> {
    const [algorithm, salt, storedKey, extra] = hashedPassword.split('$')
    if (
      algorithm !== 'scrypt' ||
      !salt ||
      !storedKey ||
      extra !== undefined ||
      !/^[a-f0-9]{32}$/.test(salt) ||
      !/^[a-f0-9]{128}$/.test(storedKey)
    ) {
      return false
    }
    return timingSafeEqual(await this.derive(password, salt), Buffer.from(storedKey, 'hex'))
  }
}
