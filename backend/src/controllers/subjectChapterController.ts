import { Request, Response } from 'express';
import { Subject } from '../models/Subject';
import { Chapter } from '../models/Chapter';

/**
 * GET /api/subjects
 * Auth: Student or Admin
 * Returns all subjects.
 */
export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await Subject.find({}).sort({ name: 1 }).lean();
    res.status(200).json({
      success: true,
      data: {
        subjects: subjects.map((s) => ({
          id: s._id.toString(),
          name: s.name,
          applicableStreams: s.applicableStreams,
        })),
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
 * POST /api/admin/chapters
 * Auth: Admin only
 * Creates a new chapter for a subject and class.
 */
export const createChapter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId, class: classLevel, name, order } = req.body || {};

    if (!subjectId || !classLevel || !name) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'subjectId, class (XI|XII), and name are required',
        },
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

    const chapter = await Chapter.create({
      subjectId,
      class: classLevel,
      name: name.trim(),
      order: order || 1,
    });

    res.status(201).json({
      success: true,
      data: {
        id: chapter._id.toString(),
        subjectId: chapter.subjectId.toString(),
        class: chapter.class,
        name: chapter.name,
        order: chapter.order,
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
 * GET /api/chapters
 * Auth: Student or Admin
 * Returns chapters filterable by subjectId and class.
 */
export const getChapters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId, class: classLevel } = req.query;
    const filter: any = {};

    if (subjectId) filter.subjectId = subjectId;
    if (classLevel) filter.class = classLevel;

    const chapters = await Chapter.find(filter).sort({ order: 1, name: 1 }).lean();

    res.status(200).json({
      success: true,
      data: {
        chapters: chapters.map((c) => ({
          id: c._id.toString(),
          subjectId: c.subjectId.toString(),
          class: c.class,
          name: c.name,
          order: c.order,
        })),
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
 * DELETE /api/admin/chapters/:id
 * Auth: Admin only
 * Deletes a chapter.
 */
export const deleteChapter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const chapter = await Chapter.findByIdAndDelete(id);

    if (!chapter) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Chapter not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { id: chapter._id.toString(), deleted: true },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};
