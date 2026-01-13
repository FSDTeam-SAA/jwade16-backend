import { Schema, Document } from 'mongoose';

export interface ICompensation extends Document {
  companyName: string;
  jobTitle: string;
  location: string; // city/state
  jobLevel: string; // e.g., L5, Senior, Junior
  baseSalary: number;
  annualBonus: number;
  equity: string; // e.g., "10000 RSUS"
  yearsOfExperience: number;
  createdAt: Date;
  updatedAt: Date;
}

export const CompensationSchema = new Schema<ICompensation>(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    jobLevel: {
      type: String,
      required: [true, 'Job level is required'],
      trim: true,
    },
    baseSalary: {
      type: Number,
      required: [true, 'Base salary is required'],
      min: [0, 'Base salary cannot be negative'],
    },
    annualBonus: {
      type: Number,
      required: [true, 'Annual bonus is required'],
      min: [0, 'Annual bonus cannot be negative'],
    },
    equity: {
      type: String,
      required: [true, 'Equity is required'],
      trim: true,
    },
    yearsOfExperience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Years of experience cannot be negative'],
    },
  },
  {
    timestamps: true,
  },
);
