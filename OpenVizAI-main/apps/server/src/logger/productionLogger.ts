import { createLogger, format, transports } from 'winston';

const { combine, timestamp, label, printf } = format;

const prodLogFormat = printf(({ message, data, label, timestamp }) => {
  return `${timestamp} ${label} : ${message} ${data ? JSON.stringify(data, null, 2) : ''}`;
});

const productionLogger = () => {
  return createLogger({
    level: 'info',
    format: combine(
      label({ label: 'prod' }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      prodLogFormat,
    ),
    transports: [
      new transports.File({ filename: './logs/loggerInfo.log', level: 'info' }),
      new transports.File({
        filename: './logs/loggerError.log',
        level: 'error',
      }),
      new transports.Console(),
    ],
  });
};

export default productionLogger;

