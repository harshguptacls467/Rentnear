import { IResponse } from '@interfaces/index';
import { Response } from 'express';

export const successResponse = <T>(
  res: Response,
  status: number,
  message: string,
  data?: T,
  meta?: Record<string, unknown>,
): Response<IResponse<T>> => {
  return res.status(status).json({
    statusCode: status,
    message,
    data,
    meta,
  });
};

export const errorResponse = <T>(
  res: Response,
  status: number,
  message: string,
  error?: string,
): Response<IResponse<T>> => {
  return res.status(status).json({
    statusCode: status,
    message,
    error,
  });
};

