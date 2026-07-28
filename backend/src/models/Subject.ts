import mongoose, { Schema, Document } from 'mongoose';
import { StreamType } from './Batch';

export interface ISubject extends Document {
  name: string;
  applicableStreams: StreamType[];
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      unique: true,
      trim: true,
    },
    applicableStreams: [
      {
        type: String,
        enum: ['JEE', 'NEET', 'Foundation'],
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);
