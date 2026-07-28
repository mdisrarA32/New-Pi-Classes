import { Request, Response } from 'express';
import { Notice } from '../models/Notice';
import { User } from '../models/User';

/**
 * POST /api/admin/notices
 * Auth: Admin only
 * Posts a new notice (global or batch-scoped).
 */
export const createNotice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, body, scope = 'global', batchIds = [] } = req.body || {};

    if (!title || !body) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'title and body are required' },
      });
      return;
    }

    if (scope === 'batch' && (!Array.isArray(batchIds) || batchIds.length === 0)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'batchIds array is required when scope is batch',
        },
      });
      return;
    }

    const notice = await Notice.create({
      title: title.trim(),
      body,
      scope,
      batchIds: scope === 'batch' ? batchIds : [],
      postedBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: {
        id: notice._id.toString(),
        title: notice.title,
        body: notice.body,
        scope: notice.scope,
        batchIds: notice.batchIds.map((b) => b.toString()),
        createdAt: notice.createdAt,
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
 * GET /api/notices
 * Auth: Student or Admin
 * Student notice scoping enforcement:
 * Returns notices where scope is 'global' OR batchIds includes student's assigned batchId, in reverse-chronological order.
 */
export const getNotices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = req;
    const query: any = {};

    if (user?.role === 'student') {
      const student = await User.findById(user.id);
      if (!student || !student.batchId) {
        // If student has no batch, return only global notices
        query.scope = 'global';
      } else {
        query.$or = [{ scope: 'global' }, { batchIds: student.batchId }];
      }
    }

    const notices = await Notice.find(query)
      .populate('postedBy', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = notices.map((n: any) => ({
      id: n._id.toString(),
      title: n.title,
      body: n.body,
      scope: n.scope,
      batchIds: n.batchIds ? n.batchIds.map((b: any) => b.toString()) : [],
      postedBy: n.postedBy?.fullName || 'Admin',
      createdAt: n.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: { notices: formatted },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};

/**
 * DELETE /api/admin/notices/:id
 * Auth: Admin only
 * Deletes a notice.
 */
export const deleteNotice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notice = await Notice.findByIdAndDelete(id);

    if (!notice) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notice not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { id: notice._id.toString(), deleted: true },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};
