export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  timestamp: Date;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  pagination?: IPaginationMeta;
}
