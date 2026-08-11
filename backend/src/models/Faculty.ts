import mongoose, { Schema, Document } from 'mongoose';

export interface IFaculty extends Document {
  name: string;
  role: string;
  subject: 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics';
  qualification: string;
  specialization?: string;
  bio: string;
  photoUrl?: string | null;
  isPublished: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const facultySchema = new Schema<IFaculty>(
  {
    name: {
      type: String,
      required: [true, 'Faculty name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Faculty role/title is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      enum: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
    },
    qualification: {
      type: String,
      required: [true, 'Qualification is required'],
      trim: true,
    },
    specialization: {
      type: String,
      default: '',
      trim: true,
    },
    bio: {
      type: String,
      required: [true, 'Bio/description is required'],
      trim: true,
    },
    photoUrl: {
      type: String,
      default: null,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

export const Faculty = mongoose.model<IFaculty>('Faculty', facultySchema);
