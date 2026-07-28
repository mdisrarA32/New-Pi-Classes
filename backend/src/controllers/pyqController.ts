import { Request, Response } from 'express';
import { PYQ } from '../models/PYQ';
import { User } from '../models/User';
import { Subject } from '../models/Subject';

const VALID_CLASSES = ['XI', 'XII'];
const VALID_EXAM_TYPES = ['JEE', 'NEET'];

/**
 * POST /api/admin/pyqs
 * Auth: Admin only
 * Creates a Previous Year Question (PYQ) entry.
 */
export const createPYQ = async (req: Request, res: Response): Promise<void> => {
  try {
    const { class: classLevel, examType, subjectId, chapterId, year, title, fileUrl } = req.body || {};

    if (!classLevel || !examType || !subjectId || !year || !title || !fileUrl) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'class (XI|XII), examType (JEE|NEET), subjectId, year, title, and fileUrl are required',
        },
      });
      return;
    }

    if (!VALID_CLASSES.includes(classLevel)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Invalid class '${classLevel}'` },
      });
      return;
    }

    if (!VALID_EXAM_TYPES.includes(examType)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Invalid examType '${examType}'` },
      });
      return;
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Subject not found' },
      });
      return;
    }

    const pyq = await PYQ.create({
      class: classLevel,
      examType,
      subjectId,
      chapterId: chapterId || null,
      year: Number(year),
      title: title.trim(),
      fileUrl,
      uploadedBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: {
        id: pyq._id.toString(),
        class: pyq.class,
        examType: pyq.examType,
        subjectId: pyq.subjectId.toString(),
        chapterId: pyq.chapterId ? pyq.chapterId.toString() : null,
        year: pyq.year,
        title: pyq.title,
        fileUrl: pyq.fileUrl,
        createdAt: pyq.createdAt,
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
 * GET /api/pyqs
 * Auth: Student or Admin
 * Lists PYQs filterable by subjectId, year, examType.
 * Student caller is automatically locked to their own class.
 */
export const getPYQs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = req;
    const { subjectId, year, examType, class: requestedClass } = req.query;
    const query: any = {};

    if (user?.role === 'student') {
      const student = await User.findById(user.id);
      if (!student || !student.class) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Student class info missing' },
        });
        return;
      }
      query.class = student.class; // Lock to student's class
    } else if (requestedClass) {
      query.class = requestedClass;
    }

    if (subjectId) query.subjectId = subjectId;
    if (year) query.year = Number(year);
    if (examType) query.examType = examType;

    const pyqs = await PYQ.find(query)
      .populate('subjectId', 'name')
      .populate('chapterId', 'name')
      .sort({ year: -1, createdAt: -1 })
      .lean();

    const formatted = pyqs.map((p: any) => ({
      id: p._id.toString(),
      class: p.class,
      examType: p.examType,
      subjectId: p.subjectId?._id?.toString() || null,
      subjectName: p.subjectId?.name || '',
      chapterId: p.chapterId?._id?.toString() || null,
      chapterName: p.chapterId?.name || null,
      year: p.year,
      title: p.title,
      fileUrl: p.fileUrl,
      createdAt: p.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: { pyqs: formatted },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};

/**
 * DELETE /api/admin/pyqs/:id
 * Auth: Admin only
 * Deletes a PYQ paper.
 */
export const deletePYQ = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pyq = await PYQ.findByIdAndDelete(id);

    if (!pyq) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'PYQ item not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { id: pyq._id.toString(), deleted: true },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};
