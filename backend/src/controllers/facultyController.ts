import { Request, Response } from 'express';
import { Faculty } from '../models/Faculty';

/**
 * GET /api/faculty
 * Public: returns published faculty members
 */
export const getPublicFaculty = async (req: Request, res: Response): Promise<void> => {
  try {
    const faculty = await Faculty.find({ isPublished: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        faculty: faculty.map((f) => ({
          id: f._id.toString(),
          name: f.name,
          role: f.role,
          subject: f.subject,
          qualification: f.qualification,
          specialization: f.specialization,
          bio: f.bio,
          photoUrl: f.photoUrl,
          order: f.order,
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
 * GET /api/admin/faculty
 * Admin: returns all faculty members (published and draft)
 */
export const getAdminFacultyList = async (req: Request, res: Response): Promise<void> => {
  try {
    const faculty = await Faculty.find()
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        faculty: faculty.map((f) => ({
          id: f._id.toString(),
          name: f.name,
          role: f.role,
          subject: f.subject,
          qualification: f.qualification,
          specialization: f.specialization,
          bio: f.bio,
          photoUrl: f.photoUrl,
          isPublished: f.isPublished,
          order: f.order,
          createdAt: f.createdAt,
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
 * POST /api/admin/faculty
 * Admin: create a new faculty member
 */
export const createFaculty = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      role,
      subject,
      qualification,
      specialization,
      bio,
      photoUrl,
      isPublished = true,
      order = 1,
    } = req.body || {};

    if (!name || !role || !subject || !qualification || !bio) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'name, role, subject, qualification, and bio are required',
        },
      });
      return;
    }

    const newFaculty = await Faculty.create({
      name: name.trim(),
      role: role.trim(),
      subject,
      qualification: qualification.trim(),
      specialization: (specialization || '').trim(),
      bio: bio.trim(),
      photoUrl: photoUrl || null,
      isPublished: Boolean(isPublished),
      order: Number(order) || 1,
    });

    res.status(201).json({
      success: true,
      data: {
        id: newFaculty._id.toString(),
        name: newFaculty.name,
        role: newFaculty.role,
        subject: newFaculty.subject,
        qualification: newFaculty.qualification,
        specialization: newFaculty.specialization,
        bio: newFaculty.bio,
        photoUrl: newFaculty.photoUrl,
        isPublished: newFaculty.isPublished,
        order: newFaculty.order,
        createdAt: newFaculty.createdAt,
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
 * PUT /api/admin/faculty/:id
 * Admin: update faculty details or toggle publish status
 */
export const updateFaculty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};

    const updated = await Faculty.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Faculty member not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: updated._id.toString(),
        name: updated.name,
        role: updated.role,
        subject: updated.subject,
        qualification: updated.qualification,
        specialization: updated.specialization,
        bio: updated.bio,
        photoUrl: updated.photoUrl,
        isPublished: updated.isPublished,
        order: updated.order,
        updatedAt: updated.updatedAt,
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
 * DELETE /api/admin/faculty/:id
 * Admin: delete faculty member
 */
export const deleteFaculty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Faculty.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Faculty member not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Faculty member deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};
