import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStudentAnswer {
  id: string; // Question ID e.g. "q1"
  selectedOptionIndex: number | null; // 0-3 or null if unattempted
}

export interface IResult extends Document {
  testId: Types.ObjectId;
  studentId: Types.ObjectId;
  answers: IStudentAnswer[];
  score: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  submittedAt: Date;
  autoSubmitted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const studentAnswerSchema = new Schema<IStudentAnswer>(
  {
    id: { type: String, required: true },
    selectedOptionIndex: { type: Number, default: null },
  },
  { _id: false }
);

const resultSchema = new Schema<IResult>(
  {
    testId: {
      type: Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    answers: [studentAnswerSchema],
    score: {
      type: Number,
      required: true,
    },
    correctCount: {
      type: Number,
      required: true,
      default: 0,
    },
    incorrectCount: {
      type: Number,
      required: true,
      default: 0,
    },
    unattemptedCount: {
      type: Number,
      required: true,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    autoSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound UNIQUE index enforcing single attempt per student per test at database level
resultSchema.index({ testId: 1, studentId: 1 }, { unique: true });

export const Result = mongoose.model<IResult>('Result', resultSchema);
