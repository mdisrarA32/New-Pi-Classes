import { Request, Response } from 'express';
import { Batch } from '../models/Batch';
import { User } from '../models/User';

const VALID_CLASSES = ['XI', 'XII'];
const VALID_STREAMS = ['JEE', 'NEET', 'Foundation'];

/**
 * POST /api/admin/batches
 * Auth: Admin only
 * Creates a new batch. Validates class and stream enums.
 */
export const createBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, class: classLevel, stream, timingLabel } = req.body || {};

    if (!name || !classLevel || !stream) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'name, class (XI|XII), and stream (JEE|NEET|Foundation) are required',
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

    if (!VALID_STREAMS.includes(stream)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid stream '${stream}'. Must be one of: ${VALID_STREAMS.join(', ')}`,
        },
      });
      return;
    }

    const batch = await Batch.create({
      name: name.trim(),
      class: classLevel,
      stream,
      timingLabel: (timingLabel || '').trim(),
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: {
        id: batch._id.toString(),
        name: batch.name,
        class: batch.class,
        stream: batch.stream,
        timingLabel: batch.timingLabel,
        isActive: batch.isActive,
        createdAt: batch.createdAt,
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
 * GET /api/admin/batches
 * Auth: Admin or Student
 * Lists batches with student counts. Optional ?includeArchived=true.
 */
export const getBatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const filter = includeArchived ? {} : { isActive: true };

    const batches = await Batch.find(filter).sort({ createdAt: -1 }).lean();

    const formatted = await Promise.all(
      batches.map(async (b) => {
        const studentCount = await User.countDocuments({
          batchId: b._id,
          role: 'student',
          isActive: true,
        });
        return {
          id: b._id.toString(),
          name: b.name,
          class: b.class,
          stream: b.stream,
          timingLabel: b.timingLabel,
          isActive: b.isActive,
          studentCount,
          createdAt: b.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { batches: formatted },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};

/**
 * GET /api/admin/batches/:id
 * Auth: Admin only
 * Fetch single batch details with enrolled student list.
 */
export const getBatchById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const batch = await Batch.findById(id);

    if (!batch) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Batch not found' },
      });
      return;
    }

    const studentCount = await User.countDocuments({
      batchId: batch._id,
      role: 'student',
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: {
        id: batch._id.toString(),
        name: batch.name,
        class: batch.class,
        stream: batch.stream,
        timingLabel: batch.timingLabel,
        isActive: batch.isActive,
        studentCount,
        createdAt: batch.createdAt,
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
 * PATCH /api/admin/batches/:id
 * Auth: Admin only
 * Updates batch name, class, stream, timingLabel, or isActive state.
 */
export const updateBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, class: classLevel, stream, timingLabel, isActive } = req.body || {};

    const batch = await Batch.findById(id);
    if (!batch) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Batch not found' },
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

    if (stream && !VALID_STREAMS.includes(stream)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid stream '${stream}'. Must be one of: ${VALID_STREAMS.join(', ')}`,
        },
      });
      return;
    }

    if (name !== undefined) batch.name = name.trim();
    if (classLevel !== undefined) batch.class = classLevel;
    if (stream !== undefined) batch.stream = stream;
    if (timingLabel !== undefined) batch.timingLabel = timingLabel.trim();
    if (isActive !== undefined) batch.isActive = Boolean(isActive);

    await batch.save();

    res.status(200).json({
      success: true,
      data: {
        id: batch._id.toString(),
        name: batch.name,
        class: batch.class,
        stream: batch.stream,
        timingLabel: batch.timingLabel,
        isActive: batch.isActive,
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
 * DELETE /api/admin/batches/:id
 * Auth: Admin only
 * Soft-deletes/archives a batch (BATCH-2).
 */
export const deleteBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const enrolledCount = await User.countDocuments({ batchId: id, role: 'student' });
    if (enrolledCount > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BATCH_HAS_STUDENTS',
          message: `Cannot delete batch with ${enrolledCount} enrolled student${enrolledCount > 1 ? 's' : ''}. Reassign students first.`,
        },
      });
      return;
    }

    const batch = await Batch.findByIdAndDelete(id);

    if (!batch) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Batch not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: batch._id.toString(),
        name: batch.name,
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
 * PATCH /api/admin/batches/:id/reactivate
 * Auth: Admin only
 * Reactivates an archived batch.
 */
export const reactivateBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const batch = await Batch.findByIdAndUpdate(id, { isActive: true }, { new: true });

    if (!batch) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Batch not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: batch._id.toString(),
        name: batch.name,
        isActive: true,
        reactivated: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};
