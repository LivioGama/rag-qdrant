import winston from 'winston'

export const logFilePath = 'findRelevantFiles.log' // Centralized log file path

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    winston.format.errors({stack: true}),
    winston.format.splat(),
    winston.format.printf(
      ({level, message, timestamp, stack}) =>
        `${timestamp} [${level.toUpperCase()}]: ${stack || message}`,
    ),
  ),
  transports: [
    new winston.transports.File({filename: logFilePath, level: 'info'}),
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      level: 'info',
    }),
  ],
})

logger.info(`Logging to file: ${logFilePath}`)
