import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { WinstonModule } from 'nest-winston'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

export function createLogger() {
  const logDirectory = join(process.cwd(), 'logs')
  mkdirSync(logDirectory, { recursive: true })

  return WinstonModule.createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    transports: [
      new winston.transports.Console(),
      new DailyRotateFile({
        dirname: logDirectory,
        filename: 'api-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '100m',
        maxFiles: '30d',
      }),
    ],
  })
}
