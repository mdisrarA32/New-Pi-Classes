import mongoose, { Schema, Document, Types } from 'mongoose';

export type MaterialType = 'pdf' | 'video' | 'note';

export interface IMaterial extends Document {
  chapterId: Types.ObjectId;
  title: string;
  type: MaterialType;
  fileUrl?: string | null;
  noteContent?: string | null;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const materialSchema = new Schema<IMaterial>(
  {
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: [true, 'Chapter ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Material title is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['pdf', 'video', 'note'],
      required: [true, 'Material type is required'],
    },
    fileUrl: {
      type: String,
      default: null,
    },
    noteContent: {
      type: String,
      default: null,
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

export const Material = mongoose.model<IMaterial>('Material', materialSchema);
