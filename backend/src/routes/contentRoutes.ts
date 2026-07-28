import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { getSubjects, getChapters } from '../controllers/subjectChapterController';
import { getMaterials } from '../controllers/materialController';
import { getPYQs } from '../controllers/pyqController';
import { getNotices } from '../controllers/noticeController';
import {
  getStudentTests,
  getStudentTestAttempt,
  submitTest,
  getStudentTestResult,
} from '../controllers/testController';
import { getTestRankings } from '../controllers/rankingController';

const router = Router();

// Student & Admin Shared Read Routes (requireAuth)
router.use(requireAuth);

router.get('/subjects', getSubjects);
router.get('/chapters', getChapters);
router.get('/materials', getMaterials);
router.get('/pyqs', getPYQs);
router.get('/notices', getNotices);

// Test & Rankings Routes (Student-accessible)
router.get('/tests', getStudentTests);
router.get('/tests/:id/attempt', getStudentTestAttempt);
router.post('/tests/:id/submit', submitTest);
router.get('/tests/:id/result', getStudentTestResult);
router.get('/tests/:id/rankings', getTestRankings);

export default router;
