import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MongoError } from 'mongodb';

interface HttpExceptionResponse {
  message?: string;
  errors?: any[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse) {
        message =
          (exceptionResponse as HttpExceptionResponse).message || message;
        errors = (exceptionResponse as HttpExceptionResponse).errors || errors;
      }
    } else if (exception instanceof MongoError) {
      status = HttpStatus.BAD_REQUEST;
      message = this.handleMongoError(exception);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  private handleMongoError(exception: MongoError): string {
    switch (exception.code) {
      case 11000:
        return 'Duplicate entry found';
      default:
        return 'Database error occurred';
    }
  }
}
