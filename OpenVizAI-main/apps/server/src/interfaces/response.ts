export interface IResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

export interface IError {
  status?: number;
  statusCode?: number;
  name: string;
  message: string;
  stack?: string;
}

