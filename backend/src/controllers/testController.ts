import { Request, Response } from 'express';
import { Test, IQuestion } from '../models/Test';
import { Result } from '../models/Result';
import { Batch } from '../models/Batch';
import { Subject } from '../models/Subject';
import { User } from '../models/User';

// 60-second grace window for auto-submit & network transmission delay
export const GRACE_WINDOW_MS = 60 * 1000;

/**
 * Helper to compute server-side test status
 */
export function getTestStatus(
  scheduledAt: Date,
  durationMinutes: number,
  now: Date = new Date()
): 'upcoming' | 'active' | 'completed' {
  const startTime = new Date(scheduledAt).getTime();
  const endTime = startTime + durationMinutes * 60 * 1000;
  const currentTime = now.getTime();

  if (currentTime < startTime) return 'upcoming';
  if (currentTime > endTime + GRACE_WINDOW_MS) return 'completed';
  return 'active';
}

/**
 * POST /api/admin/tests
 * Auth: Admin only
 * Creates a test shell and its embedded questions.
 */
export const createTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      subjectIds,
      batchIds,
      scheduledAt,
      durationMinutes,
      negativeMarkingRatio = 0.25,
      questions,
    } = req.body || {};

    if (!title || !subjectIds || !batchIds || !scheduledAt || !durationMinutes || !questions) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'title, subjectIds, batchIds, scheduledAt, durationMinutes, and questions are required',
        },
      });
      return;
    }

    if (!Array.isArray(batchIds) || batchIds.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'At least one target batchId is required' },
      });
      return;
    }

    // Verify batches exist and are active
    const validBatches = await Batch.find({ _id: { $in: batchIds }, isActive: true });
    if (validBatches.length !== batchIds.length) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'One or more batchIds are invalid or archived' },
      });
      return;
    }

    // Verify subjects exist
    const validSubjects = await Subject.find({ _id: { $in: subjectIds } });
    if (validSubjects.length !== subjectIds.length) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'One or more subjectIds are invalid' },
      });
      return;
    }

    // Validate questions array
    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'At least one question is required' },
      });
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.id || !q.text || !Array.isArray(q.options) || q.options.length !== 4 || q.correctOptionIndex === undefined) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Question #${i + 1} is invalid. Requires id, text, 4 options, and correctOptionIndex (0-3).`,
          },
        });
        return;
      }
    }

    const test = await Test.create({
      title: title.trim(),
      subjectIds,
      batchIds,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: Number(durationMinutes),
      negativeMarkingRatio: Number(negativeMarkingRatio),
      questions,
      createdBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: {
        id: test._id.toString(),
        title: test.title,
        scheduledAt: test.scheduledAt,
        durationMinutes: test.durationMinutes,
        negativeMarkingRatio: test.negativeMarkingRatio,
        questionCount: test.questions.length,
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
 * GET /api/admin/tests
 * Auth: Admin only
 * List all tests with computed status.
 */
export const getAdminTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const tests = await Test.find({})
      .populate('subjectIds', 'name')
      .populate('batchIds', 'name class stream')
      .sort({ scheduledAt: -1 })
      .lean();

    const now = new Date();
    const formatted = tests.map((t: any) => ({
      id: t._id.toString(),
      title: t.title,
      scheduledAt: t.scheduledAt,
      durationMinutes: t.durationMinutes,
      status: getTestStatus(t.scheduledAt, t.durationMinutes, now),
      negativeMarkingRatio: t.negativeMarkingRatio,
      batches: t.batchIds.map((b: any) => b.name),
      questionCount: t.questions.length,
      createdAt: t.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: { tests: formatted },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};

/**
 * GET /api/tests
 * Auth: Student
 * Returns tests scheduled for the logged-in student's batch ONLY.
 * NEVER includes correctOptionIndex before submission.
 */
export const getStudentTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await User.findById(req.user!.id);
    if (!student || !student.batchId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Student is not assigned to a batch' },
      });
      return;
    }

    const tests = await Test.find({ batchIds: student.batchId })
      .populate('subjectIds', 'name')
      .sort({ scheduledAt: -1 })
      .lean();

    const now = new Date();
    const formatted = await Promise.all(
      tests.map(async (t: any) => {
        const status = getTestStatus(t.scheduledAt, t.durationMinutes, now);
        const existingResult = await Result.findOne({ testId: t._id, studentId: student._id });

        return {
          id: t._id.toString(),
          title: t.title,
          scheduledAt: t.scheduledAt,
          durationMinutes: t.durationMinutes,
          status,
          hasSubmitted: Boolean(existingResult),
          questionCount: t.questions.length,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { tests: formatted },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};

/**
 * GET /api/tests/:id/attempt
 * Auth: Student
 * Fetches test questions for an active test the student is eligible to take.
 * STRICT SECURITY: Never includes correctOptionIndex in response payload!
 */
export const getStudentTestAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await User.findById(req.user!.id);

    if (!student || !student.batchId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Student is not assigned to a batch' },
      });
      return;
    }

    const test = await Test.findById(id);
    if (!test) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Test not found' },
      });
      return;
    }

    // Verify batch access
    const isTargeted = test.batchIds.some((b) => b.toString() === student.batchId!.toString());
    if (!isTargeted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Test not available for your batch' },
      });
      return;
    }

    const now = new Date();
    const startTime = new Date(test.scheduledAt).getTime();
    const endTime = startTime + test.durationMinutes * 60 * 1000;
    const currentTime = now.getTime();

    if (currentTime < startTime) {
      res.status(400).json({
        success: false,
        error: {
          code: 'TEST_WINDOW_CLOSED',
          message: `Test has not started yet. Scheduled to start at ${test.scheduledAt.toISOString()}`,
        },
      });
      return;
    }

    if (currentTime > endTime + GRACE_WINDOW_MS && !test.isReopened) {
      res.status(400).json({
        success: false,
        error: {
          code: 'TEST_WINDOW_CLOSED',
          message: 'Test window has closed. Submissions are no longer accepted.',
        },
      });
      return;
    }

    // Check if already submitted
    const existingResult = await Result.findOne({ testId: test._id, studentId: student._id });
    if (existingResult) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_SUBMITTED',
          message: 'You have already submitted this test. Duplicate attempts are not allowed.',
        },
      });
      return;
    }

    const remainingSeconds = Math.max(0, Math.floor((endTime - currentTime) / 1000));

    // Strip correctOptionIndex from questions!
    const secureQuestions = test.questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options,
    }));

    res.status(200).json({
      success: true,
      data: {
        id: test._id.toString(),
        title: test.title,
        durationMinutes: test.durationMinutes,
        scheduledAt: test.scheduledAt,
        remainingSeconds,
        questions: secureQuestions,
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
 * POST /api/tests/:id/submit
 * Auth: Student
 * Submits test answers. Computes score 100% server-side with negative marking.
 */
export const submitTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { answers = [], autoSubmitted = false } = req.body || {};
    const student = await User.findById(req.user!.id);

    if (!student || !student.batchId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Student is not assigned to a batch' },
      });
      return;
    }

    const test = await Test.findById(id);
    if (!test) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Test not found' },
      });
      return;
    }

    // Verify batch access
    const isTargeted = test.batchIds.some((b) => b.toString() === student.batchId!.toString());
    if (!isTargeted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Test not available for your batch' },
      });
      return;
    }

    // Time window enforcement
    const now = new Date();
    const startTime = new Date(test.scheduledAt).getTime();
    const endTime = startTime + test.durationMinutes * 60 * 1000;
    const currentTime = now.getTime();

    if (currentTime > endTime + GRACE_WINDOW_MS && !test.isReopened) {
      res.status(400).json({
        success: false,
        error: {
          code: 'TEST_WINDOW_CLOSED',
          message: 'Test window has closed. Submission rejected.',
        },
      });
      return;
    }

    // Single attempt check (Application level check)
    const existingResult = await Result.findOne({ testId: test._id, studentId: student._id });
    if (existingResult) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_SUBMITTED',
          message: 'You have already submitted this test.',
        },
      });
      return;
    }

    // Server-side grading calculation
    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const answerMap = new Map<string, number | null>();
    if (Array.isArray(answers)) {
      answers.forEach((ans: any) => {
        const key = ans?.questionId || ans?.id;
        if (key) {
          answerMap.set(String(key), ans.selectedOptionIndex !== undefined ? ans.selectedOptionIndex : null);
        }
      });
    }

    const review = test.questions.map((q: any) => {
      const qId = String(q.id || (q.get && q.get('id')));
      const qMarks = q.marks || 4;
      maxScore += qMarks;
      const selectedIndex = answerMap.get(qId);

      if (selectedIndex === null || selectedIndex === undefined) {
        unattemptedCount += 1;
        return {
          id: q.id,
          text: q.text,
          options: q.options,
          selectedOptionIndex: null,
          correctOptionIndex: q.correctOptionIndex,
          isCorrect: false,
          isUnattempted: true,
          marksAwarded: 0,
        };
      }

      const isCorrect = selectedIndex === q.correctOptionIndex;
      if (isCorrect) {
        correctCount += 1;
        score += qMarks;
      } else {
        incorrectCount += 1;
        const penalty = qMarks * test.negativeMarkingRatio;
        score -= penalty;
      }

      return {
        id: q.id,
        text: q.text,
        options: q.options,
        selectedOptionIndex: selectedIndex,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        isUnattempted: false,
        marksAwarded: isCorrect ? qMarks : -(qMarks * test.negativeMarkingRatio),
      };
    });

    // Save Result record (Database unique index enforces race-condition single submission)
    const result = new Result({
      testId: test._id,
      studentId: student._id,
      answers: Array.from(answerMap.entries()).map(([qId, idx]) => ({
        id: qId,
        selectedOptionIndex: idx,
      })),
      score,
      correctCount,
      incorrectCount,
      unattemptedCount,
      submittedAt: now,
      autoSubmitted: Boolean(autoSubmitted),
    });

    await result.save();

    res.status(201).json({
      success: true,
      data: {
        score,
        maxScore,
        correctCount,
        wrongCount: incorrectCount,
        unattemptedCount,
        review,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_SUBMITTED',
          message: 'Duplicate submission attempt blocked by database constraint.',
        },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
};

/**
 * GET /api/tests/:id/result
 * Auth: Student
 * Fetch student's own test result + answer review.
 */
export const getStudentTestResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const studentId = req.user!.id;

    const result = await Result.findOne({ testId: id, studentId }).populate('testId');
    if (!result) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Result not found for this test' },
      });
      return;
    }

    const test = result.testId as any;
    const answerMap = new Map(result.answers.map((a) => [a.id, a.selectedOptionIndex]));

    let maxScore = 0;
    const review = test.questions.map((q: any) => {
      const qId = q.get ? q.get('id') : q.id;
      const qMarks = q.marks || 4;
      maxScore += qMarks;
      const selectedIndex = answerMap.get(qId);
      const isCorrect = selectedIndex === q.correctOptionIndex;
      const isUnattempted = selectedIndex === null || selectedIndex === undefined;

      return {
        id: q.id,
        text: q.text,
        options: q.options,
        selectedOptionIndex: selectedIndex ?? null,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        isUnattempted,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        testId: test._id.toString(),
        title: test.title,
        score: result.score,
        maxScore,
        correctCount: result.correctCount,
        wrongCount: result.incorrectCount,
        unattemptedCount: result.unattemptedCount,
        submittedAt: result.submittedAt,
        autoSubmitted: result.autoSubmitted,
        review,
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
 * GET /api/admin/tests/:id
 * Auth: Admin only
 * Fetches the full details of a specific test, including questions and correct options, for admin display.
 */
export const getAdminTestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const test = await Test.findById(id)
      .populate('subjectIds', 'name')
      .populate('batchIds', 'name class stream')
      .lean();

    if (!test) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Test not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { test },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};

