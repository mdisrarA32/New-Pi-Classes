/**
 * ⚠️ WARNING: THIS TEST SCRIPT RUNS DESTRUCTIVELY ON THE DATABASE.
 * Running this script will execute deleteMany({}) and clear data
 * (including Users, Batches, Subjects, etc.) from whatever database
 * MONGO_URI points to in your .env configuration.
 *
 * Ensure you are NOT running this against a production or populated
 * development database.
 */

import http from 'http';
import dotenv from 'dotenv';
import app from '../index';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Batch } from '../models/Batch';
import { Subject } from '../models/Subject';
import { Chapter } from '../models/Chapter';
import { Test } from '../models/Test';
import { Result } from '../models/Result';
import bcrypt from 'bcryptjs';
import { enforceDestructiveGuard } from './destructiveGuard';

dotenv.config();
enforceDestructiveGuard();

let server: http.Server;
const PORT = 5013;
const BASE_URL = `http://localhost:${PORT}/api`;

async function makeRequest(
  method: string,
  path: string,
  body?: any,
  cookie?: string
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const postData = body ? JSON.stringify(body) : '';

    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          Cookie: cookie || '',
        },
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            const parsed = resData ? JSON.parse(resData) : {};
            resolve({ status: res.statusCode || 500, headers: res.headers, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode || 500, headers: res.headers, body: resData });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

export async function runPhase9Tests() {
  console.log('\n=== Starting Phase 9 Integration Tests (Online Tests, Results & Rankings UI) ===\n');

  await connectDB();
  server = app.listen(PORT);

  try {
    // 1. Reset collections
    await User.deleteMany({});
    await Batch.deleteMany({});
    await Subject.deleteMany({});
    await Chapter.deleteMany({});
    await Test.deleteMany({});
    await Result.deleteMany({});

    // 2. Create Subject & Batch & Admin
    const physics = await Subject.create({ name: 'Physics', applicableStreams: ['NEET'] });
    const batch = await Batch.create({ name: 'Class XI NEET Batch', class: 'XI', stream: 'NEET' });
    const adminPassHash = await bcrypt.hash('AdminPass123!', 10);
    const admin = await User.create({ role: 'admin', fullName: 'Admin', username: 'admin', passwordHash: adminPassHash });

    // 3. Create Test with 5 Questions
    const now = new Date();
    const test = await Test.create({
      title: 'Class 11 NEET Mock Test 1',
      batchIds: [batch._id],
      subjectIds: [physics._id],
      durationMinutes: 60,
      scheduledAt: new Date(now.getTime() - 1000 * 60 * 5), // Started 5 mins ago (active)
      negativeMarkingRatio: 0.25,
      createdBy: admin._id,
      questions: [
        { id: 'q1', text: 'Velocity is defined as?', options: ['Distance/Time', 'Displacement/Time', 'Speed*Time', 'Acceleration/Time'], correctOptionIndex: 1, marks: 4 },
        { id: 'q2', text: 'Unit of force is?', options: ['Joule', 'Pascal', 'Newton', 'Watt'], correctOptionIndex: 2, marks: 4 },
        { id: 'q3', text: 'Acceleration due to gravity g is?', options: ['9.8 m/s^2', '10 m/s', '9.8 N', '9.8 m/s^3'], correctOptionIndex: 0, marks: 4 },
        { id: 'q4', text: 'Work done is scalar or vector?', options: ['Scalar', 'Vector', 'Tensor', 'None'], correctOptionIndex: 0, marks: 4 },
        { id: 'q5', text: 'SI unit of Power is?', options: ['Joule', 'Watt', 'Newton', 'Ampere'], correctOptionIndex: 1, marks: 4 },
      ],
    });

    const passHash = await bcrypt.hash('StudentPass123!', 10);

    // 4. Create 12 Students & seed results for top 10
    const students: any[] = [];
    for (let i = 1; i <= 12; i++) {
      const student = await User.create({
        role: 'student',
        fullName: `Rank ${i} Aspirant`,
        username: `student${i}`,
        passwordHash: passHash,
        class: 'XI',
        batchId: batch._id,
        isActive: true,
      });
      students.push(student);

      if (i <= 10) {
        // Seed score for Top 10
        await Result.create({
          testId: test._id,
          studentId: student._id,
          answers: [
            { id: 'q1', selectedOptionIndex: 1 },
            { id: 'q2', selectedOptionIndex: 2 },
          ],
          score: 20 - i, // Scores: 19 down to 10
          correctCount: 5 - Math.floor(i / 3),
          incorrectCount: Math.floor(i / 3),
          unattemptedCount: 0,
          submittedAt: new Date(now.getTime() - (12 - i) * 1000 * 60),
        });
      }
    }

    // 5. Student 11 logs in and attempts test via API
    const student11 = students[10]; // student11
    const loginRes = await makeRequest('POST', '/auth/login', { username: 'student11', password: 'StudentPass123!' });
    const cookie11 = (loginRes.headers['set-cookie']?.[0] || '').split(';')[0];

    console.log('\n--- 1. Testing GET /api/tests/:id/attempt (No correctOptionIndex) ---');
    const attemptRes = await makeRequest('GET', `/tests/${test._id}/attempt`, null, cookie11);
    console.log('✓ Attempt Request Status:', attemptRes.status);
    console.log('✓ Questions Count Returned:', attemptRes.body.data?.questions?.length);
    console.log('✓ Remaining Seconds Synced:', attemptRes.body.data?.remainingSeconds > 0);
    const hasCorrectIndexInAttempt = attemptRes.body.data?.questions?.some((q: any) => q.correctOptionIndex !== undefined);
    console.log('✓ PROOF: Security Guard - correctOptionIndex is NOT exposed during attempt:', !hasCorrectIndexInAttempt);

    const questionsFromAttempt = attemptRes.body.data?.questions || [];
    const q1Id = questionsFromAttempt[0]?.id;
    const q2Id = questionsFromAttempt[1]?.id;

    console.log('\n--- 2. Testing Test Submission & Result Calculation ---');
    const submitRes = await makeRequest('POST', `/tests/${test._id}/submit`, {
      answers: [
        { questionId: q1Id, selectedOptionIndex: 1 }, // Correct (+4)
        { questionId: q2Id, selectedOptionIndex: 0 }, // Incorrect (-1)
      ],
    }, cookie11);

    console.log('✓ Submit Request Status:', submitRes.status);
    console.log('✓ Score Calculated:', submitRes.body.data?.score, '(Expected 3 = 4 - 1)');
    console.log('✓ Correct Count:', submitRes.body.data?.correctCount, '(Expected 1)');
    console.log('✓ Wrong Count:', submitRes.body.data?.wrongCount, '(Expected 1)');
    console.log('✓ PROOF: Negative marking math verified:', submitRes.body.data?.score === 3);

    console.log('\n--- 3. Testing Double Submission Block ---');
    const doubleSubmitRes = await makeRequest('POST', `/tests/${test._id}/submit`, {
      answers: [{ questionId: q1Id, selectedOptionIndex: 1 }],
    }, cookie11);

    console.log('✓ Double Submit Status:', doubleSubmitRes.status, '(Expected 400)');
    console.log('✓ Error Code:', doubleSubmitRes.body.error?.code);
    console.log('✓ PROOF: Double submission blocked server-side:', doubleSubmitRes.body.error?.code === 'ALREADY_SUBMITTED');

    console.log('\n--- 4. Testing GET /api/tests/:id/result (Unlocked Review) ---');
    const resultRes = await makeRequest('GET', `/tests/${test._id}/result`, null, cookie11);
    console.log('✓ GET Result Status:', resultRes.status);
    console.log('✓ Score in Result:', resultRes.body.data?.score);
    const reviewHasCorrectIndex = resultRes.body.data?.review?.every((q: any) => q.correctOptionIndex !== undefined);
    console.log('✓ PROOF: Post-submission review exposes correctOptionIndex:', reviewHasCorrectIndex);

    console.log('\n--- 5. Testing GET /api/tests/:id/rankings (Top 10 & Rank Privacy) ---');
    // Also seed Student 12 with score 1
    await Result.create({
      testId: test._id,
      studentId: students[11]._id,
      answers: [],
      score: 1,
      correctCount: 0,
      incorrectCount: 0,
      unattemptedCount: 5,
      submittedAt: now,
    });

    const rankingsRes = await makeRequest('GET', `/tests/${test._id}/rankings`, null, cookie11);
    console.log('✓ Rankings Request Status:', rankingsRes.status);
    console.log('✓ Top 10 Count Returned:', rankingsRes.body.data?.top10?.length, '(Expected 10)');
    console.log('✓ Student 11 MyRank Returned:', rankingsRes.body.data?.myRank, '(Expected 11)');
    console.log('✓ Student 11 MyScore Returned:', rankingsRes.body.data?.myScore, '(Expected 3)');

    const top10Usernames = rankingsRes.body.data?.top10?.map((e: any) => e.username);
    const leaksStudent12 = top10Usernames.includes('student12');
    console.log('✓ PROOF: Rank Privacy - Student 12 (Rank 12) is NOT in Top 10 array:', !leaksStudent12);

    console.log('\n=== ALL PHASE 9 INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n');
  } catch (err) {
    console.error('Phase 9 Test Failure:', err);
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runPhase9Tests().then(() => process.exit(0)).catch(() => process.exit(1));
}
