import { Request, Response } from 'express';
import { Course } from '../models/Course';

const VALID_CLASSES = ['XI', 'XII'];
const VALID_STREAMS = ['JEE', 'NEET', 'Foundation'];

/**
 * POST /api/admin/courses
 * Auth: Admin only
 * Creates a course/fee card offering.
 */
export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, class: classLevel, stream, fee, description, isActive = true } = req.body || {};

    if (!name || !classLevel || !stream || fee === undefined) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'name, class (XI|XII), stream (JEE|NEET|Foundation), and fee are required',
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

    if (!VALID_STREAMS.includes(stream)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Invalid stream '${stream}'` },
      });
      return;
    }

    const course = await Course.create({
      name: name.trim(),
      class: classLevel,
      stream,
      fee: Number(fee),
      description: description ? description.trim() : '',
      isActive: Boolean(isActive),
    });

    res.status(201).json({
      success: true,
      data: {
        id: course._id.toString(),
        name: course.name,
        class: course.class,
        stream: course.stream,
        fee: course.fee,
        description: course.description,
        isActive: course.isActive,
        createdAt: course.createdAt,
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
 * GET /api/courses
 * Auth: None (Public)
 * Returns active course/fee cards for the marketing site.
 */
export const getPublicCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const courses = await Course.find({ isActive: true }).sort({ class: 1, stream: 1 }).lean();

    res.status(200).json({
      success: true,
      data: {
        courses: courses.map((c) => ({
          id: c._id.toString(),
          name: c.name,
          class: c.class,
          stream: c.stream,
          fee: c.fee,
          description: c.description,
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
 * GET /api/admin/courses
 * Auth: Admin only
 * Returns all courses including inactive ones.
 */
export const getAdminCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const courses = await Course.find({}).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      data: {
        courses: courses.map((c) => ({
          id: c._id.toString(),
          name: c.name,
          class: c.class,
          stream: c.stream,
          fee: c.fee,
          description: c.description,
          isActive: c.isActive,
          createdAt: c.createdAt,
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
 * PATCH /api/admin/courses/:id
 * Auth: Admin only
 * Updates a course.
 */
export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const course = await Course.findByIdAndUpdate(id, updates, { new: true });

    if (!course) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Course not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: course._id.toString(),
        name: course.name,
        class: course.class,
        stream: course.stream,
        fee: course.fee,
        description: course.description,
        isActive: course.isActive,
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
 * DELETE /api/admin/courses/:id
 * Auth: Admin only
 * Soft deletes / deactivates a course.
 */
export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Course not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { id: course._id.toString(), name: course.name },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};
