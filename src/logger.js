import winston from 'winston';

export default {
  getLogger: (category) => {
    const options = {
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.label({ label: category }),
        winston.format.printf(({ level, message, label, timestamp }) => {
          return `${timestamp} [${label}] ${level}: ${message}`;
        }),
      ),
      transports: [new winston.transports.Console({ level: 'error' })],
    };
    const logger = winston.loggers.get(category, options);
    return logger;
  },
};
