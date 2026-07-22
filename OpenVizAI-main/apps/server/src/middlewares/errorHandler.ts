import { errorResponse, HTTP_STATUS_CODE } from '@utils/index';
import { NextFunction, Request, Response } from 'express';
import { IError } from '@interfaces/index';
import { IS_PRODUCTION } from '@config/secrets';
class ErrorHandler {
  private static sendErrorDev(err: IError, res: Response) {
    // in development , show error stack along response

    // Handle specific error types with user-friendly messages
    let message = err.message;
    let statusCode = err.statusCode;

    switch (err.name) {
      case 'TokenExpiredError':
        message = 'Token has expired. Please login again.';
        statusCode = HTTP_STATUS_CODE.UNAUTHORIZED;
        break;
      case 'JsonWebTokenError':
        message = 'Invalid token. Please login again.';
        statusCode = HTTP_STATUS_CODE.UNAUTHORIZED;
        break;
      case 'NotBeforeError':
        message = 'Token not active yet.';
        statusCode = HTTP_STATUS_CODE.UNAUTHORIZED;
        break;
      default:
        // Keep original message and status code
        break;
    }

    return errorResponse(res, statusCode || HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, message, err.stack);
  }

  private static sendErrorProd(err: IError, res: Response) {
    // Handle specific error types for production
    let message = err.message;
    let statusCode = err.statusCode;

    switch (err.name) {
      case 'TokenExpiredError':
        message = 'Token has expired. Please login again.';
        statusCode = HTTP_STATUS_CODE.UNAUTHORIZED;
        break;
      case 'JsonWebTokenError':
        message = 'Invalid token. Please login again.';
        statusCode = HTTP_STATUS_CODE.UNAUTHORIZED;
        break;
      case 'NotBeforeError':
        message = 'Token not active yet.';
        statusCode = HTTP_STATUS_CODE.UNAUTHORIZED;
        break;
      default:
        if (err.message === 'Invalid Google credentials') {
          message = 'Invalid Google token or credentials';
          statusCode = HTTP_STATUS_CODE.UNAUTHORIZED;
        }
        break;
    }

    return errorResponse(res, statusCode || HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, message);
  }

  // Express requires 4 parameters to recognize error handling middleware
  public static middleware(
    err: IError,
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
  ) {
    err.statusCode = err.statusCode || HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR;
    err.status = err.status || HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR;

    if (IS_PRODUCTION) {
      ErrorHandler.sendErrorProd(err, res);
    } else {
      ErrorHandler.sendErrorDev(err, res);
    }
  }
}

export default ErrorHandler;

