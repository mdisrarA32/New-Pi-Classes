import mongoose, { Schema, Document } from 'mongoose';
import { ClassLevel } from './User';

export type StreamType = 'JEE' | 'NEET' | 'Foundation';

export interface IBatch extends Document {
  name: string;
  class: ClassLevel;
  stream: StreamType;
  timingLabel?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
    },
    class: {
      type: String,
      enum: ['XI', 'XII'],
      required: [true, 'Class level is required'],
    },
    stream: {
      type: String,
      enum: ['JEE', 'NEET', 'Foundation'],
      required: [true, 'Stream type is required'],
    },
    timingLabel: {
      type: String,
      trim: true,
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

export const Batch = mongoose.model<IBatch>('Batch', batchSchema);
