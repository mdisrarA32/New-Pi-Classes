import mongoose, { Schema, Document, Types } from 'mongoose';
import { ClassLevel } from './User';

export type ExamType = 'JEE' | 'NEET';

export interface IPYQ extends Document {
  class: ClassLevel;
  examType: ExamType;
  subjectId: Types.ObjectId;
  chapterId?: Types.ObjectId | null;
  year: number;
  title: string;
  fileUrl: string;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const pyqSchema = new Schema<IPYQ>(
  {
    class: {
      type: String,
      enum: ['XI', 'XII'],
      required: [true, 'Class is required'],
    },
    examType: {
      type: String,
      enum: ['JEE', 'NEET'],
      required: [true, 'Exam type is required'],
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
      index: true,
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      default: null,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'PYQ title is required'],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const PYQ = mongoose.model<IPYQ>('PYQ', pyqSchema);
