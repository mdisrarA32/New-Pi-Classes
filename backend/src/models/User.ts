import mongoose, { Schema, Document, Types } from 'mongoose';

export type UserRole = 'student' | 'admin';
export type ClassLevel = 'XI' | 'XII';

export interface IUser extends Document {
  role: UserRole;
  fullName: string;
  username: string;
  passwordHash: string;
  batchId?: Types.ObjectId | null;
  class?: ClassLevel | null;
  isActive: boolean;
  lastPasswordResetAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    role: {
      type: String,
      enum: ['student', 'admin'],
      required: true,
      default: 'student',
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    class: {
      type: String,
      enum: ['XI', 'XII'],
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastPasswordResetAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
