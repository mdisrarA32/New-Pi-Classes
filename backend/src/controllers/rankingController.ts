import { Request, Response } from 'express';
import { Test } from '../models/Test';
import { Result } from '../models/Result';
import { User } from '../models/User';

/**
 * GET /api/tests/:id/rankings
 * Auth: Student or Admin
 * Computes batch-scoped test rankings on read.
 * Privacy Rule:
 * Ranks 1-3: badge (gold/silver/bronze) + name + score
 * Ranks 4-10: name + score
 * Ranks 11+: identities/scores omitted from general leaderboard! Student sees own rank in `myRank`.
 */
export const getTestRankings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { user } = req;

    const test = await Test.findById(id);
    if (!test) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Test not found' },
      });
      return;
    }

    let targetBatchId: string | null = null;

    if (user?.role === 'student') {
      const student = await User.findById(user.id);
      if (!student || !student.batchId) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Student is not assigned to a batch' },
        });
        return;
      }

      // Check if test belongs to student's batch
      const isTargeted = test.batchIds.some((b) => b.toString() === student.batchId!.toString());
      if (!isTargeted) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Test rankings not available for your batch' },
        });
        return;
      }
      targetBatchId = student.batchId.toString();
    } else if (req.query.batchId) {
      targetBatchId = req.query.batchId as string;
    } else {
      targetBatchId = test.batchIds[0]?.toString() || null;
    }

    if (!targetBatchId) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Batch ID context missing' },
      });
      return;
    }

    // Find all students in this batch
    const batchStudents = await User.find({ batchId: targetBatchId, role: 'student' }).select('_id fullName');
    const batchStudentIds = batchStudents.map((s) => s._id);

    // Fetch results for this test for students in targetBatchId
    const results = await Result.find({ testId: test._id, studentId: { $in: batchStudentIds } })
      .populate('studentId', 'fullName')
      .lean();

    // Sort results:
    // 1. score DESC
    // 2. incorrectCount ASC (Fewer wrong answers rank higher - tiebreaker 1)
    // 3. submittedAt ASC (Faster completion rank higher - tiebreaker 2)
    results.sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.incorrectCount !== b.incorrectCount) return a.incorrectCount - b.incorrectCount;
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });

    const badgeMap: Record<number, string> = {
      1: 'gold',
      2: 'silver',
      3: 'bronze',
    };

    let myRankData: { rank: number; score: number; badge?: string } | null = null;

    const top10Leaderboard: any[] = [];

    results.forEach((r: any, index: number) => {
      const rank = index + 1;
      const isSelf = user?.role === 'student' && r.studentId?._id?.toString() === user.id;

      if (isSelf) {
        myRankData = {
          rank,
          score: r.score,
          badge: badgeMap[rank] || undefined,
        };
      }

      // Privacy Enforcement: Only top 10 returned in the public leaderboard array
      if (rank <= 10) {
        top10Leaderboard.push({
          rank,
          name: r.studentId?.fullName || 'Student',
          score: r.score,
          badge: badgeMap[rank] || null,
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        testId: test._id.toString(),
        testTitle: test.title,
        batchId: targetBatchId,
        top10: top10Leaderboard,
        myRank: myRankData,
        totalAttempted: results.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};
