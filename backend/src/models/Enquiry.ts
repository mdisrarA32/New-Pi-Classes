import mongoose, { Schema, Document } from 'mongoose';
import { ClassLevel } from './User';
import { StreamType } from './Batch';

export type EnquiryStatus = 'new' | 'contacted' | 'closed';

export interface IEnquiry extends Document {
  name: string;
  phone: string;
  classInterested: ClassLevel;
  streamInterested: StreamType;
  message?: string;
  status: EnquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const enquirySchema = new Schema<IEnquiry>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    classInterested: {
      type: String,
      enum: ['XI', 'XII'],
      required: [true, 'Class interested is required'],
    },
    streamInterested: {
      type: String,
      enum: ['JEE', 'NEET', 'Foundation'],
      required: [true, 'Stream interested is required'],
    },
    message: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
);

export const Enquiry = mongoose.model<IEnquiry>('Enquiry', enquirySchema);
