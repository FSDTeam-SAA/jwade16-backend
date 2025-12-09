import {
  IApiResponse,
  IPaginatedResponse,
  IPaginationMeta,
} from '../interfaces/api-response.interface';

export class ApiResponse {
  static success<T>(message: string, data?: T): IApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date(),
    };
  }

  static error(message: string, errors?: any[]): IApiResponse<null> {
    return {
      success: false,
      message,
      errors,
      timestamp: new Date(),
    };
  }

  static paginated<T>(
    message: string,
    data: T[],
    meta: IPaginationMeta,
  ): IPaginatedResponse<T> {
    return {
      success: true,
      message,
      data,
      pagination: meta,
      timestamp: new Date(),
    };
  }
}
