import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuestion {
  id: string; // e.g. "q1"
  text: string;
  options: string[]; // Array of 4 options
  correctOptionIndex: number; // 0-3 (Never exposed before submission)
  marks: number; // Full marks for correct answer
}

export interface ITest extends Document {
  title: string;
  subjectIds: Types.ObjectId[];
  batchIds: Types.ObjectId[];
  questions: IQuestion[];
  scheduledAt: Date; // Start time
  durationMinutes: number;
  negativeMarkingRatio: number; // Default 0.25 (-25%)
  isReopened: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true, min: 0, max: 3 },
    marks: { type: Number, required: true, default: 4 },
  },
  { _id: false }
);

const testSchema = new Schema<ITest>(
  {
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true,
    },
    subjectIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
      },
    ],
    batchIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Batch',
        required: true,
      },
    ],
    questions: [questionSchema],
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled start time is required'],
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: 1,
    },
    negativeMarkingRatio: {
      type: Number,
      default: 0.25,
    },
    isReopened: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Test = mongoose.model<ITest>('Test', testSchema);
