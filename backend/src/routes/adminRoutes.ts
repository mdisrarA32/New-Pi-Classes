import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  resetStudentPassword,
  deactivateStudent,
  reactivateStudent,
  deleteStudent,
} from '../controllers/studentController';
import {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  reactivateBatch,
} from '../controllers/batchController';
import { createChapter, deleteChapter } from '../controllers/subjectChapterController';
import { createMaterial, deleteMaterial } from '../controllers/materialController';
import { createPYQ, deletePYQ } from '../controllers/pyqController';
import { createNotice, deleteNotice } from '../controllers/noticeController';
import { getEnquiries, updateEnquiryStatus, deleteEnquiry } from '../controllers/enquiryController';
import {
  createTestimonial,
  getAdminTestimonials,
  updateTestimonial,
  deleteTestimonial,
} from '../controllers/testimonialController';
import {
  createCourse,
  getAdminCourses,
  updateCourse,
  deleteCourse,
} from '../controllers/courseController';
import {
  getAdminFacultyList,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} from '../controllers/facultyController';
import { createTest, getAdminTests, getAdminTestById } from '../controllers/testController';

const router = Router();

// Protect all admin routes with auth and admin role check
router.use(requireAuth);
router.use(requireRole('admin'));

// Student Management
router.post('/students', createStudent);
router.get('/students', getStudents);
router.get('/students/:id', getStudentById);
router.patch('/students/:id', updateStudent);
router.post('/students/:id/reset-password', resetStudentPassword);
router.patch('/students/:id/deactivate', deactivateStudent);
router.patch('/students/:id/reactivate', reactivateStudent);
router.delete('/students/:id', deleteStudent);

// Batch Management
router.post('/batches', createBatch);
router.get('/batches', getBatches);
router.get('/batches/:id', getBatchById);
router.patch('/batches/:id', updateBatch);
router.delete('/batches/:id', deleteBatch);
router.patch('/batches/:id/reactivate', reactivateBatch);

// Subject & Chapter Management
router.post('/chapters', createChapter);
router.delete('/chapters/:id', deleteChapter);

// Study Material & PYQ Management
router.post('/materials', createMaterial);
router.delete('/materials/:id', deleteMaterial);
router.post('/pyqs', createPYQ);
router.delete('/pyqs/:id', deletePYQ);

// Notice Management
router.post('/notices', createNotice);
router.delete('/notices/:id', deleteNotice);

// Enquiry CRM Management
router.get('/enquiries', getEnquiries);
router.patch('/enquiries/:id', updateEnquiryStatus);
router.delete('/enquiries/:id', deleteEnquiry);

// Testimonials Management
router.post('/testimonials', createTestimonial);
router.get('/testimonials', getAdminTestimonials);
router.patch('/testimonials/:id', updateTestimonial);
router.delete('/testimonials/:id', deleteTestimonial);

// Courses & Fee Cards Management
router.post('/courses', createCourse);
router.get('/courses', getAdminCourses);
router.patch('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Faculty Management
router.get('/faculty', getAdminFacultyList);
router.post('/faculty', createFaculty);
router.patch('/faculty/:id', updateFaculty);
router.put('/faculty/:id', updateFaculty);
router.delete('/faculty/:id', deleteFaculty);

// Test Engine Management
router.post('/tests', createTest);
router.get('/tests', getAdminTests);
router.get('/tests/:id', getAdminTestById);

export default router;
