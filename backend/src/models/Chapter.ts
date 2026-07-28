import mongoose, { Schema, Document, Types } from 'mongoose';
import { ClassLevel } from './User';

export interface IChapter extends Document {
  subjectId: Types.ObjectId;
  class: ClassLevel;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const chapterSchema = new Schema<IChapter>(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
      index: true,
    },
    class: {
      type: String,
      enum: ['XI', 'XII'],
      required: [true, 'Class is required'],
    },
    name: {
      type: String,
      required: [true, 'Chapter name is required'],
      trim: true,
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

// Compound index for class + subject query optimization
chapterSchema.index({ subjectId: 1, class: 1 });

export const Chapter = mongoose.model<IChapter>('Chapter', chapterSchema);
