import mongoose, { Schema, Document } from 'mongoose';
import { ClassLevel } from './User';
import { StreamType } from './Batch';

export interface ICourse extends Document {
  name: string;
  class: ClassLevel;
  stream: StreamType;
  fee: number;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    class: {
      type: String,
      enum: ['XI', 'XII'],
      required: [true, 'Class is required'],
    },
    stream: {
      type: String,
      enum: ['JEE', 'NEET', 'Foundation'],
      required: [true, 'Stream is required'],
    },
    fee: {
      type: Number,
      required: [true, 'Fee amount is required'],
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Course = mongoose.model<ICourse>('Course', courseSchema);
