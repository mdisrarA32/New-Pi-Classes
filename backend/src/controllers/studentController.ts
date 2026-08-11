import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User';
import { Batch } from '../models/Batch';
import { generateStudentUsername } from '../utils/usernameGenerator';

const VALID_CLASSES = ['XI', 'XII'];

/**
 * POST /api/admin/students
 * Auth: Admin only
 * Creates a student account. Auto-generates username per formula.
 * Server-side validation: Batch must exist and be active. Class must be XI or XII.
 */
export const createStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, class: classLevel, batchId, password } = req.body || {};

    if (!name || !classLevel || !batchId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'name, class (XI|XII), and batchId are required',
        },
      });
      return;
    }

    if (!VALID_CLASSES.includes(classLevel)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid class '${classLevel}'. Must be one of: ${VALID_CLASSES.join(', ')}`,
        },
      });
      return;
    }

    // Verify batch exists and is active
    const batch = await Batch.findById(batchId);
    if (!batch || !batch.isActive) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Target batch does not exist or has been archived/deactivated',
        },
      });
      return;
    }

    // Auto-generate username (e.g. npcrahu2601)
    const username = await generateStudentUsername(name.trim());

    // Password: use provided or auto-generate initial password
    const rawPassword =
      password && password.trim().length >= 4
        ? password.trim()
        : `Npc@${crypto.randomBytes(3).toString('hex')}`;

    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const student = await User.create({
      role: 'student',
      fullName: name.trim(),
      username,
      passwordHash,
      class: classLevel,
      batchId,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: {
        id: student._id.toString(),
        name: student.fullName,
        username: student.username,
        class: student.class,
        batchId: student.batchId ? student.batchId.toString() : null,
        initialPassword: password ? undefined : rawPassword, // Expose only if auto-generated
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};

/**
 * GET /api/admin/students
 * Auth: Admin only
 * Lists students filterable by batchId, class, search, status (active/inactive/all).
 */
export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchId, class: classLevel, search, status = 'all', page = '1', limit = '100' } = req.query;

    const query: any = { role: 'student' };

    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;
    // status === 'all' includes both active and inactive

    if (batchId) query.batchId = batchId;
    if (classLevel) query.class = classLevel;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 100;
    const skip = (pageNum - 1) * limitNum;

    const [students, total] = await Promise.all([
      User.find(query)
        .populate('batchId', 'name class stream timingLabel')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    const formatted = students.map((s: any) => ({
      id: s._id.toString(),
      name: s.fullName,
      fullName: s.fullName,
      username: s.username,
      class: s.class,
      batchId: s.batchId?._id?.toString() || null,
      batchName: s.batchId?.name || 'Unassigned',
      isActive: s.isActive,
      lastPasswordResetAt: s.lastPasswordResetAt || null,
      createdAt: s.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        students: formatted,
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};

/**
 * GET /api/admin/students/:id
 * Auth: Admin only
 * Fetch single student profile details.
 */
export const getStudentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await User.findOne({ _id: id, role: 'student' }).populate('batchId', 'name class stream');

    if (!student) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Student profile not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: student._id.toString(),
        name: student.fullName,
        username: student.username,
        class: student.class,
        batchId: student.batchId ? (student.batchId as any)._id.toString() : null,
        batchName: student.batchId ? (student.batchId as any).name : 'Unassigned',
        isActive: student.isActive,
        lastPasswordResetAt: student.lastPasswordResetAt || null,
        createdAt: student.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};

/**
 * PATCH /api/admin/students/:id
 * Auth: Admin only
 * Update student name, class, or batch assignment.
 */
export const updateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, class: classLevel, batchId, isActive } = req.body || {};

    const student = await User.findOne({ _id: id, role: 'student' });
    if (!student) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Student record not found' },
      });
      return;
    }

    if (classLevel && !VALID_CLASSES.includes(classLevel)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid class '${classLevel}'. Must be one of: ${VALID_CLASSES.join(', ')}`,
        },
      });
      return;
    }

    if (batchId) {
      const batch = await Batch.findById(batchId);
      if (!batch || !batch.isActive) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Target batch does not exist or has been archived',
          },
        });
        return;
      }
      student.batchId = batchId;
    }

    if (name !== undefined) student.fullName = name.trim();
    if (classLevel !== undefined) student.class = classLevel;
    if (isActive !== undefined) student.isActive = Boolean(isActive);

    await student.save();

    res.status(200).json({
      success: true,
      data: {
        id: student._id.toString(),
        name: student.fullName,
        username: student.username,
        class: student.class,
        batchId: student.batchId ? student.batchId.toString() : null,
        isActive: student.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};

/**
 * POST /api/admin/students/:id/reset-password
 * Auth: Admin only
 * Resets student password and returns plaintext password ONCE in response (STU-4).
 */
export const resetStudentPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};

    const student = await User.findOne({ _id: id, role: 'student' });
    if (!student) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Student record not found' },
      });
      return;
    }

    const generatedPassword =
      newPassword && newPassword.trim().length >= 4
        ? newPassword.trim()
        : `Npc@${crypto.randomBytes(3).toString('hex')}`;

    student.passwordHash = await bcrypt.hash(generatedPassword, 10);
    student.lastPasswordResetAt = new Date();
    await student.save();

    res.status(200).json({
      success: true,
      data: {
        username: student.username,
        newPassword: generatedPassword,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};

/**
 * PATCH /api/admin/students/:id/deactivate
 * Auth: Admin only
 * Deactivates a student account (disables login).
 */
export const deactivateStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await User.findOneAndUpdate(
      { _id: id, role: 'student' },
      { isActive: false },
      { new: true }
    );

    if (!student) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Student record not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { id: student._id.toString(), username: student.username, isActive: false },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};

/**
 * PATCH /api/admin/students/:id/reactivate
 * Auth: Admin only
 * Reactivates a deactivated student account.
 */
export const reactivateStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await User.findOneAndUpdate(
      { _id: id, role: 'student' },
      { isActive: true },
      { new: true }
    );

    if (!student) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Student record not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { id: student._id.toString(), username: student.username, isActive: true },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};

/**
 * DELETE /api/admin/students/:id
 * Auth: Admin only
 * Permanently deletes a student record from the database.
 */
export const deleteStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await User.findOneAndDelete({ _id: id, role: 'student' });

    if (!student) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Student record not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { id: student._id.toString(), username: student.username, deleted: true },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};
