import { Response } from 'express';

interface IResponseData<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export const sendResponse = <T>(res: Response, data: IResponseData<T>) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    errors: data.errors,
  });
};
