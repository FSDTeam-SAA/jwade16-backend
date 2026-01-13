import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCompensationDto } from './dto/create-compensation.dto';
import { UpdateCompensationDto } from './dto/update-compensation.dto';
import { ICompensation } from './compensation.schema';

@Injectable()
export class CompensationService {
  constructor(
    @InjectModel('Compensation')
    private compensationModel: Model<ICompensation>,
  ) {}

  /**
   * Create a new compensation record
   */
  async create(
    createCompensationDto: CreateCompensationDto,
  ): Promise<ICompensation> {
    try {
      const newCompensation = new this.compensationModel(createCompensationDto);
      return await newCompensation.save();
    } catch (error) {
      throw new BadRequestException('Failed to create compensation record');
    }
  }

  /**
   * Get all compensation records
   */
  async findAll(): Promise<ICompensation[]> {
    return await this.compensationModel.find().exec();
  }

  /**
   * Get a single compensation record by ID
   */
  async findOne(id: string): Promise<ICompensation> {
    const compensation = await this.compensationModel.findById(id).exec();
    if (!compensation) {
      throw new NotFoundException(
        `Compensation record with ID ${id} not found`,
      );
    }
    return compensation;
  }

  /**
   * Update a compensation record
   */
  async update(
    id: string,
    updateCompensationDto: UpdateCompensationDto,
  ): Promise<ICompensation> {
    const updatedCompensation = await this.compensationModel
      .findByIdAndUpdate(id, updateCompensationDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updatedCompensation) {
      throw new NotFoundException(
        `Compensation record with ID ${id} not found`,
      );
    }
    return updatedCompensation;
  }

  /**
   * Delete a compensation record
   */
  async remove(id: string): Promise<ICompensation> {
    const deletedCompensation = await this.compensationModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedCompensation) {
      throw new NotFoundException(
        `Compensation record with ID ${id} not found`,
      );
    }
    return deletedCompensation;
  }

  /**
   * Search compensation records by company name
   */
  async findByCompanyName(companyName: string): Promise<ICompensation[]> {
    return await this.compensationModel
      .find({ companyName: { $regex: companyName, $options: 'i' } })
      .exec();
  }

  /**
   * Search compensation records by job title
   */
  async findByJobTitle(jobTitle: string): Promise<ICompensation[]> {
    return await this.compensationModel
      .find({ jobTitle: { $regex: jobTitle, $options: 'i' } })
      .exec();
  }

  /**
   * Get compensation records by location
   */
  async findByLocation(location: string): Promise<ICompensation[]> {
    return await this.compensationModel
      .find({ location: { $regex: location, $options: 'i' } })
      .exec();
  }

  /**
   * Get compensation records by job level
   */
  async findByJobLevel(jobLevel: string): Promise<ICompensation[]> {
    return await this.compensationModel
      .find({ jobLevel: { $regex: jobLevel, $options: 'i' } })
      .exec();
  }
}
