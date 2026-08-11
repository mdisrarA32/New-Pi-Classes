import { Router } from 'express';
import { createEnquiry } from '../controllers/enquiryController';
import { getPublicTestimonials } from '../controllers/testimonialController';
import { getPublicCourses } from '../controllers/courseController';
import { getPublicFaculty } from '../controllers/facultyController';

const router = Router();

// Fully public endpoints (no auth required)
router.post('/enquiries', createEnquiry);
router.get('/testimonials', getPublicTestimonials);
router.get('/courses', getPublicCourses);
router.get('/faculty', getPublicFaculty);

export default router;

