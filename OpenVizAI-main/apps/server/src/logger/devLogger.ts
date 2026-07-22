import { createLogger, format, transports } from 'winston';

const { combine, timestamp, label, printf } = format;

// Define the log format for file transports
const fileFormat = printf(({ message, data, label, timestamp }) => {
  return `${timestamp} ${label} : ${message} ${data ? JSON.stringify(data, null, 2) : ''}`;
});
const devLogger = () => {
  return createLogger({
    level: 'debug',
    format: combine(
      format.colorize(),
      label({ label: 'dev' }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      fileFormat,
    ),
    transports: [
      new transports.Console(), // only print logs in terminal
      new transports.File({
        filename: './logs/devLoggerInfo.log',
        level: 'info',
      }),
      new transports.File({
        filename: './logs/devLoggerError.log',
        level: 'error',
      }),
    ],
  });
};

export default devLogger;

