import mongoose, { Schema, Document } from 'mongoose';

export interface ITestimonial extends Document {
  studentName: string;
  resultText: string; // e.g. "AIR 1200, NEET 2025"
  quote: string;
  photoUrl?: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const testimonialSchema = new Schema<ITestimonial>(
  {
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    resultText: {
      type: String,
      required: [true, 'Result text is required (e.g. AIR 1200, NEET 2025)'],
      trim: true,
    },
    quote: {
      type: String,
      required: [true, 'Quote text is required'],
    },
    photoUrl: {
      type: String,
      default: null,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Testimonial = mongoose.model<ITestimonial>('Testimonial', testimonialSchema);
