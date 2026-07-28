import mongoose, { Schema, Document, Types } from 'mongoose';

export type NoticeScope = 'global' | 'batch';

export interface INotice extends Document {
  title: string;
  body: string;
  scope: NoticeScope;
  batchIds: Types.ObjectId[];
  postedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const noticeSchema = new Schema<INotice>(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Notice body is required'],
    },
    scope: {
      type: String,
      enum: ['global', 'batch'],
      default: 'global',
    },
    batchIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Batch',
      },
    ],
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Notice = mongoose.model<INotice>('Notice', noticeSchema);
