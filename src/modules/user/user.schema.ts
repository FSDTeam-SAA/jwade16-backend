import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ _id: false })
class VerificationInfo {
  @Prop({ default: false })
  verified: boolean;

  @Prop()
  token?: string;

  @Prop()
  resetToken?: string;

  @Prop()
  password_reset_token?: string;

  @Prop()
  refresh_token?: string;

  @Prop()
  resetOtp?: string;

  @Prop()
  resetOtpExpiry?: string;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  avatar?: string;

  // @Prop({ enum: ['male', 'female'], required: true })
  @Prop()
  gender: string;

  @Prop()
  address?: string;

  @Prop({ unique: true, required: true, lowercase: true })
  email: string;

  @Prop()
  phoneNum: number;

  @Prop({ type: VerificationInfo, default: {} })
  verificationInfo: VerificationInfo;

  @Prop({ enum: ['user', 'admin'], default: 'admin' })
  role: string;

  @Prop({ required: true })
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User); // converts a decorated class into a mongoose schema
