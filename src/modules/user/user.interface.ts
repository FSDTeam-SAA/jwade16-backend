export interface IVerificationInfo {
  verified: boolean;
  token?: string;
  resetToken?: string;
  password_reset_token?: string;
  refresh_token?: string;
}

export interface IUser {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  avatar?: string;
  gender: 'male' | 'female';
  address?: string;
  email: string;
  phoneNum: number;
  verificationInfo: IVerificationInfo;
  role: 'user' | 'admin';
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}
