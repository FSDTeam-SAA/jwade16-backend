import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSelection, UserSelectionDocument } from './user-selection.schema';
import { CreateUserSelectionDto } from './dto/create-user-selection.dto';

@Injectable()
export class UserSelectionService {
  constructor(
    @InjectModel(UserSelection.name)
    private userSelectionModel: Model<UserSelectionDocument>,
  ) {}

  async create(
    createUserSelectionDto: CreateUserSelectionDto,
  ): Promise<UserSelection> {
    const createdUserSelection = new this.userSelectionModel(
      createUserSelectionDto,
    );
    return createdUserSelection.save();
  }

  async findAll(): Promise<UserSelection[]> {
    return this.userSelectionModel.find().exec();
  }
}
