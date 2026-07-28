import { Request, Response } from 'express';
import { Material } from '../models/Material';
import { Chapter } from '../models/Chapter';
import { Subject } from '../models/Subject';
import { User } from '../models/User';
import { Batch } from '../models/Batch';

/**
 * POST /api/admin/materials
 * Auth: Admin only
 * Upload/create study material item linked to a chapter.
 */
export const createMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chapterId, title, type, fileUrl, noteContent } = req.body || {};

    if (!chapterId || !title || !type) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'chapterId, title, and type (pdf|video|note) are required',
        },
      });
      return;
    }

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Target chapter not found' },
      });
      return;
    }

    if (type === 'pdf' && !fileUrl) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'fileUrl is required for PDF material' },
      });
      return;
    }

    if (type === 'video' && !fileUrl) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'videoUrl/fileUrl is required for video material' },
      });
      return;
    }

    const material = await Material.create({
      chapterId,
      title: title.trim(),
      type,
      fileUrl: fileUrl || null,
      noteContent: noteContent || null,
      uploadedBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: {
        id: material._id.toString(),
        chapterId: material.chapterId.toString(),
        title: material.title,
        type: material.type,
        fileUrl: material.fileUrl,
        noteContent: material.noteContent,
        createdAt: material.createdAt,
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
 * GET /api/materials
 * Auth: Student or Admin
 * Server-side student content scoping:
 * If caller is a student, automatically locks filtering to student's enrolled class and batch stream subjects.
 */
export const getMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = req;
    let allowedChapterIds: string[] = [];

    if (user?.role === 'student') {
      const student = await User.findById(user.id).populate('batchId');
      if (!student || !student.class || !student.batchId) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Student profile or batch assignment missing' },
        });
        return;
      }

      const studentClass = student.class; // 'XI' or 'XII'
      const studentStream = (student.batchId as any).stream; // 'JEE', 'NEET', 'Foundation'

      // Find subjects applicable to student's stream
      const applicableSubjects = await Subject.find({
        applicableStreams: studentStream,
      }).select('_id');
      const subjectIds = applicableSubjects.map((s) => s._id);

      // Find chapters matching student's class and applicable subjects
      const validChapters = await Chapter.find({
        class: studentClass,
        subjectId: { $in: subjectIds },
      }).select('_id');

      allowedChapterIds = validChapters.map((c) => c._id.toString());
    }

    const query: any = {};
    const { chapterId } = req.query;

    if (user?.role === 'student') {
      query.chapterId = { $in: allowedChapterIds };
    } else if (chapterId) {
      query.chapterId = chapterId;
    }

    const materials = await Material.find(query)
      .populate({
        path: 'chapterId',
        select: 'name class subjectId',
        populate: { path: 'subjectId', select: 'name' },
      })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = materials.map((m: any) => ({
      id: m._id.toString(),
      title: m.title,
      type: m.type,
      fileUrl: m.fileUrl,
      noteContent: m.noteContent,
      chapterId: m.chapterId?._id?.toString() || null,
      chapterName: m.chapterId?.name || '',
      class: m.chapterId?.class || '',
      subjectName: m.chapterId?.subjectId?.name || '',
      createdAt: m.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: { materials: formatted },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};

/**
 * DELETE /api/admin/materials/:id
 * Auth: Admin only
 * Deletes a material item.
 */
export const deleteMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const material = await Material.findByIdAndDelete(id);

    if (!material) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Material item not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { id: material._id.toString(), deleted: true },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};
