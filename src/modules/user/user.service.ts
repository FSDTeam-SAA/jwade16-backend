import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import cloudinary from '../../common/cloudinary';
import { Express } from 'express';

interface LeanUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  address?: string;
}

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(data: Partial<User>): Promise<UserDocument> {
    if (!data.password) throw new Error('Password is required');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = new this.userModel({ ...data, password: hashedPassword });
    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async findById(id: string) {
    return this.userModel.findById(id);
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const total = await this.userModel.countDocuments();

    const users = await this.userModel
      .find()
      .select('firstName lastName email address')
      .skip(skip)
      .limit(limit)
      .lean<LeanUser[]>()
      .exec();

    // Get story counts for all users in this page
    const userIds = users.map((user) => user._id);

    // Create a map of userId to story count

    // Add totalStories to each user
    const usersWithStoryCount = users.map((user) => ({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      address: user.address || '',
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      users: usersWithStoryCount,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    avatar?: Express.Multer.File,
  ): Promise<Partial<User> | null> {
    const updateData: Partial<User> = { ...updateUserDto };

    if (avatar) {
      const b64 = Buffer.from(avatar.buffer).toString('base64');
      const dataURI = 'data:' + avatar.mimetype + ';base64,' + b64;
      const res = await cloudinary.uploader.upload(dataURI, {
        folder: 'avatars',
      });
      updateData.avatar = res.secure_url;
    }

    console.log('updateData', updateData);

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
        select:
          'firstName lastName dateOfBirth avatar gender address phoneNum email',
      },
    );

    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found or could not be updated.`);
    }

    return updatedUser ? updatedUser.toObject() : null;
  }

  /**
   * Internal method for system-level updates (e.g., password reset OTP, verification fields)
   * Bypasses DTO validation for internal operations
   */
  async updateUserInternal(
    id: string,
    updateData: Record<string, any>,
  ): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    );
  }
}
