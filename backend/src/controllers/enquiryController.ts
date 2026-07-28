import { Request, Response } from 'express';
import { Enquiry } from '../models/Enquiry';

const VALID_CLASSES = ['XI', 'XII'];
const VALID_STREAMS = ['JEE', 'NEET', 'Foundation'];

/**
 * POST /api/enquiries
 * Auth: None (Public)
 * Public demo class / enquiry form submission.
 */
export const createEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, classInterested, streamInterested, message } = req.body || {};

    if (!name || !phone || !classInterested || !streamInterested) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'name, phone, classInterested (XI|XII), and streamInterested (JEE|NEET|Foundation) are required',
        },
      });
      return;
    }

    if (!VALID_CLASSES.includes(classInterested)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Invalid classInterested '${classInterested}'` },
      });
      return;
    }

    if (!VALID_STREAMS.includes(streamInterested)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Invalid streamInterested '${streamInterested}'` },
      });
      return;
    }

    const enquiry = await Enquiry.create({
      name: name.trim(),
      phone: phone.trim(),
      classInterested,
      streamInterested,
      message: message ? message.trim() : '',
      status: 'new',
    });

    res.status(201).json({
      success: true,
      data: {
        id: enquiry._id.toString(),
        name: enquiry.name,
        phone: enquiry.phone,
        classInterested: enquiry.classInterested,
        streamInterested: enquiry.streamInterested,
        status: enquiry.status,
        createdAt: enquiry.createdAt,
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
 * GET /api/admin/enquiries
 * Auth: Admin only
 * Lists enquiries filterable by status (new|contacted|closed).
 */
export const getEnquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const query: any = {};

    if (status) query.status = status;

    const enquiries = await Enquiry.find(query).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      data: {
        enquiries: enquiries.map((e) => ({
          id: e._id.toString(),
          name: e.name,
          phone: e.phone,
          classInterested: e.classInterested,
          streamInterested: e.streamInterested,
          message: e.message || '',
          status: e.status,
          createdAt: e.createdAt,
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
 * PATCH /api/admin/enquiries/:id
 * Auth: Admin only
 * Updates enquiry status (new | contacted | closed).
 */
export const updateEnquiryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!['new', 'contacted', 'closed'].includes(status)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Status must be new, contacted, or closed' },
      });
      return;
    }

    const enquiry = await Enquiry.findByIdAndUpdate(id, { status }, { new: true });

    if (!enquiry) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Enquiry record not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: enquiry._id.toString(),
        name: enquiry.name,
        status: enquiry.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};
