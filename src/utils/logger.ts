import winston from 'winston';

/**
 * Structured logger — outputs JSON in CI, human-readable in local dev.
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format:
    process.env.CI === 'true'
      ? winston.format.combine(winston.format.timestamp(), winston.format.json())
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'HH:mm:ss' }),
          winston.format.printf(
            ({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`,
          ),
        ),
  transports: [new winston.transports.Console()],
});
