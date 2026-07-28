import { Request, Response } from 'express';
import { Testimonial } from '../models/Testimonial';

/**
 * POST /api/admin/testimonials
 * Auth: Admin only
 * Creates a public marketing testimonial (admin-curated, fully isolated from live student results per PUB-4).
 */
export const createTestimonial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentName, resultText, quote, photoUrl, isPublished = true } = req.body || {};

    if (!studentName || !resultText || !quote) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'studentName, resultText (e.g. AIR 1200, NEET 2025), and quote are required',
        },
      });
      return;
    }

    const testimonial = await Testimonial.create({
      studentName: studentName.trim(),
      resultText: resultText.trim(),
      quote: quote.trim(),
      photoUrl: photoUrl || null,
      isPublished: Boolean(isPublished),
    });

    res.status(201).json({
      success: true,
      data: {
        id: testimonial._id.toString(),
        studentName: testimonial.studentName,
        resultText: testimonial.resultText,
        quote: testimonial.quote,
        photoUrl: testimonial.photoUrl,
        isPublished: testimonial.isPublished,
        createdAt: testimonial.createdAt,
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
 * GET /api/testimonials
 * Auth: None (Public)
 * Returns published testimonials for homepage.
 */
export const getPublicTestimonials = async (req: Request, res: Response): Promise<void> => {
  try {
    const testimonials = await Testimonial.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        testimonials: testimonials.map((t) => ({
          id: t._id.toString(),
          studentName: t.studentName,
          resultText: t.resultText,
          quote: t.quote,
          photoUrl: t.photoUrl,
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
 * GET /api/admin/testimonials
 * Auth: Admin only
 * Lists all testimonials including draft/unpublished entries.
 */
export const getAdminTestimonials = async (req: Request, res: Response): Promise<void> => {
  try {
    const testimonials = await Testimonial.find({}).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      data: {
        testimonials: testimonials.map((t) => ({
          id: t._id.toString(),
          studentName: t.studentName,
          resultText: t.resultText,
          quote: t.quote,
          photoUrl: t.photoUrl,
          isPublished: t.isPublished,
          createdAt: t.createdAt,
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
 * PATCH /api/admin/testimonials/:id
 * Auth: Admin only
 * Updates testimonial details or toggles isPublished state.
 */
export const updateTestimonial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const testimonial = await Testimonial.findByIdAndUpdate(id, updates, { new: true });

    if (!testimonial) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Testimonial not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: testimonial._id.toString(),
        studentName: testimonial.studentName,
        resultText: testimonial.resultText,
        quote: testimonial.quote,
        photoUrl: testimonial.photoUrl,
        isPublished: testimonial.isPublished,
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
 * DELETE /api/admin/testimonials/:id
 * Auth: Admin only
 * Deletes a testimonial.
 */
export const deleteTestimonial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findByIdAndDelete(id);

    if (!testimonial) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Testimonial not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { id: testimonial._id.toString(), deleted: true },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};
