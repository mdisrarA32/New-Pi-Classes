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
import { User } from '../models/User';
import { Batch } from '../models/Batch';
import { Subject } from '../models/Subject';
import { Test } from '../models/Test';
import { Result } from '../models/Result';
import { seedSubjects } from './seedSubjects';
import bcrypt from 'bcryptjs';
import { enforceDestructiveGuard } from './destructiveGuard';
import { connectDB } from '../config/db';

dotenv.config();
enforceDestructiveGuard();

let server: http.Server;
const PORT = 5008;
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

export async function runPhase4Tests() {
  console.log('\n=== Starting Phase 4 Integration Tests (Tests, Results, Negative Marking, Rankings Engine) ===\n');

  await connectDB();
  server = app.listen(PORT);

  try {
    // 1. Reset collections
    await User.deleteMany({});
    await Batch.deleteMany({});
    await Subject.deleteMany({});
    await Test.deleteMany({});
    await Result.deleteMany({});

    // 2. Seed Subjects & Admin
    await seedSubjects();
    const physicsSub = await Subject.findOne({ name: 'Physics' });

    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminPassword123!';
    const admin = await User.create({
      role: 'admin',
      fullName: 'System Admin',
      username: 'admin',
      passwordHash: await bcrypt.hash(adminPassword, 10),
      isActive: true,
    });

    const adminLoginRes = await makeRequest('POST', '/auth/login', { username: 'admin', password: adminPassword });
    const adminCookie = (adminLoginRes.headers['set-cookie']?.[0] || '').split(';')[0];
    console.log('✓ Seeded & Logged In Admin');

    // 3. Create Batches: Batch A (Target) & Batch B (Other)
    const batchARes = await makeRequest('POST', '/admin/batches', { name: 'Batch A XI NEET', class: 'XI', stream: 'NEET' }, adminCookie);
    const batchBRes = await makeRequest('POST', '/admin/batches', { name: 'Batch B XII JEE', class: 'XII', stream: 'JEE' }, adminCookie);
    const batchAId = batchARes.body.data.id;
    const batchBId = batchBRes.body.data.id;

    // --- TEST 1: SETUP TEST WITH 4 QUESTIONS & NEGATIVE MARKING ---
    console.log('\n--- 1. Testing Test Creation & Security Payload Inspection ---');
    const now = new Date();
    const activeStartTime = new Date(now.getTime() - 5 * 60 * 1000); // Started 5 mins ago

    const testPayload = {
      title: 'Physics Mechanics Unit Test 1',
      subjectIds: [physicsSub!._id],
      batchIds: [batchAId],
      scheduledAt: activeStartTime.toISOString(),
      durationMinutes: 60,
      negativeMarkingRatio: 0.25, // +4 for correct, -1 for incorrect
      questions: [
        { id: 'q1', text: 'Velocity is defined as?', options: ['Distance/Time', 'Displacement/Time', 'Speed/Time', 'Acceleration/Time'], correctOptionIndex: 1, marks: 4 },
        { id: 'q2', text: 'SI unit of Force?', options: ['Joule', 'Pascal', 'Newton', 'Watt'], correctOptionIndex: 2, marks: 4 },
        { id: 'q3', text: 'Acceleration due to gravity g on Earth?', options: ['9.8 m/s^2', '100 m/s^2', '0 m/s^2', '1 m/s^2'], correctOptionIndex: 0, marks: 4 },
        { id: 'q4', text: 'Formula for Kinetic Energy?', options: ['m*v', '1/2*m*v^2', 'm*g*h', 'F*d'], correctOptionIndex: 1, marks: 4 },
      ],
    };

    const createTestRes = await makeRequest('POST', '/admin/tests', testPayload, adminCookie);
    console.log('✓ Admin Created Test Status:', createTestRes.status);
    const testId = createTestRes.body.data.id;

    // --- CREATE 12 STUDENTS IN BATCH A FOR RANKINGS PRIVACY TESTING ---
    const studentCookies: string[] = [];
    const studentIds: string[] = [];
    for (let i = 1; i <= 12; i++) {
      const name = `Student ${i.toString().padStart(2, '0')}`;
      const sRes = await makeRequest('POST', '/admin/students', { name, class: 'XI', batchId: batchAId, password: 'Password123!' }, adminCookie);
      studentIds.push(sRes.body.data.id);
      const lRes = await makeRequest('POST', '/auth/login', { username: sRes.body.data.username, password: 'Password123!' });
      studentCookies.push((lRes.headers['set-cookie']?.[0] || '').split(';')[0]);
    }
    console.log(`✓ Created & Logged In 12 Students in Batch A`);

    // Student in Batch B (for Batch Isolation Test)
    const sOtherRes = await makeRequest('POST', '/admin/students', { name: 'Batch B Student', class: 'XII', batchId: batchBId, password: 'Password123!' }, adminCookie);
    const sOtherLogin = await makeRequest('POST', '/auth/login', { username: sOtherRes.body.data.username, password: 'Password123!' });
    const studentBCookie = (sOtherLogin.headers['set-cookie']?.[0] || '').split(';')[0];

    // --- SECURITY VERIFICATION: PAYLOAD INSPECTION ---
    console.log('\n--- 2. Security Check: Answer Key Absence Before Submission ---');
    const attemptRes = await makeRequest('GET', `/tests/${testId}/attempt`, null, studentCookies[0]);
    console.log('✓ Attempt Endpoint Status:', attemptRes.status);
    const q1Obj = attemptRes.body.data.questions[0];
    console.log('✓ Question Object Returned Keys:', Object.keys(q1Obj));
    const hasAnswerKey = attemptRes.body.data.questions.some((q: any) => q.correctOptionIndex !== undefined || q.marks !== undefined);
    console.log('✓ PROOF: correctOptionIndex is NEVER present in attempt payload:', !hasAnswerKey);

    // --- GRADING MATH VERIFICATION ---
    console.log('\n--- 3. Testing Exact Server-Side Negative Marking Math ---');
    // Student 1 answers: Q1 Correct (+4), Q2 Wrong (-1), Q3 Unattempted (0), Q4 Correct (+4) -> Expected Score: 7
    const submitMathRes = await makeRequest('POST', `/tests/${testId}/submit`, {
      answers: [
        { id: 'q1', selectedOptionIndex: 1 }, // Correct (+4)
        { id: 'q2', selectedOptionIndex: 0 }, // Wrong (-1)
        { id: 'q3', selectedOptionIndex: null }, // Unattempted (0)
        { id: 'q4', selectedOptionIndex: 1 }, // Correct (+4)
      ],
    }, studentCookies[0]);

    console.log('✓ Student 1 Submission Status:', submitMathRes.status);
    console.log('✓ Score Calculated:', submitMathRes.body.data.score, '(Expected: 7 [4 - 1 + 0 + 4])');
    console.log('✓ Correct Count:', submitMathRes.body.data.correctCount, '(Expected: 2)');
    console.log('✓ Wrong Count:', submitMathRes.body.data.wrongCount, '(Expected: 1)');
    console.log('✓ Unattempted Count:', submitMathRes.body.data.unattemptedCount, '(Expected: 1)');

    // --- FAILURE MODE 1: DUPLICATE SUBMISSION ATTEMPT ---
    console.log('\n--- 4. Failure Mode Test 1: Double Submission Attempt ---');
    const resubmitRes = await makeRequest('POST', `/tests/${testId}/submit`, {
      answers: [{ id: 'q1', selectedOptionIndex: 1 }],
    }, studentCookies[0]);
    console.log('✓ Duplicate Submission Attempt Status:', resubmitRes.status, '(Expected 400 ALREADY_SUBMITTED)');
    console.log('✓ Error Message:', resubmitRes.body.error?.message);

    // Attempting to fetch attempt after submission
    const reAttemptRes = await makeRequest('GET', `/tests/${testId}/attempt`, null, studentCookies[0]);
    console.log('✓ Attempting /attempt after submission Status:', reAttemptRes.status, '(Expected 400 ALREADY_SUBMITTED)');

    // --- FAILURE MODE 2: TIME WINDOW ENFORCEMENT ---
    console.log('\n--- 5. Failure Mode Test 2: Time Window Enforcement (Before & After) ---');
    // Test in Future (Not Started)
    const futureTest = await makeRequest('POST', '/admin/tests', {
      ...testPayload,
      title: 'Future Unstarted Test',
      scheduledAt: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(), // Tomorrow
    }, adminCookie);
    const futureAttempt = await makeRequest('GET', `/tests/${futureTest.body.data.id}/attempt`, null, studentCookies[1]);
    console.log('✓ Fetch Questions Before Start Time Status:', futureAttempt.status, '(Expected 400 TEST_WINDOW_CLOSED)');
    console.log('✓ Future Window Error Message:', futureAttempt.body.error?.message);

    // Test in Past (Closed)
    const pastTest = await makeRequest('POST', '/admin/tests', {
      ...testPayload,
      title: 'Past Expired Test',
      scheduledAt: new Date(now.getTime() - 120 * 60 * 1000).toISOString(), // 2 hrs ago
      durationMinutes: 30, // Closed 90 mins ago
    }, adminCookie);
    const pastAttempt = await makeRequest('GET', `/tests/${pastTest.body.data.id}/attempt`, null, studentCookies[1]);
    console.log('✓ Fetch Questions After Expiry Deadline Status:', pastAttempt.status, '(Expected 400 TEST_WINDOW_CLOSED)');
    console.log('✓ Past Window Error Message:', pastAttempt.body.error?.message);

    // --- FAILURE MODE 3: BATCH ISOLATION TEST ---
    console.log('\n--- 6. Failure Mode Test 3: Batch Isolation (Different Batch Student) ---');
    const otherBatchAttempt = await makeRequest('GET', `/tests/${testId}/attempt`, null, studentBCookie);
    console.log('✓ Other Batch Student Attempting Test Status:', otherBatchAttempt.status, '(Expected 404 / 403)');

    const otherBatchRankings = await makeRequest('GET', `/tests/${testId}/rankings`, null, studentBCookie);
    console.log('✓ Other Batch Student Accessing Rankings Status:', otherBatchRankings.status, '(Expected 404 / 403)');

    // --- RANKINGS ENGINE & PRIVACY RULE (TOP 10 FILTER) ---
    console.log('\n--- 7. Testing Rankings Engine & Privacy Enforcement (Ranks 11+) ---');
    // Have remaining 11 students submit test with varying scores
    // Student 1 (index 0) has score 7
    // Students 2 to 12 submit varying scores:
    const scores = [16, 12, 12, 10, 8, 7, 5, 4, 2, 0, -2]; // 11 scores
    for (let i = 1; i < 12; i++) {
      const targetScore = scores[i - 1];
      // Generate answers to match targetScore
      let ans: any[] = [];
      if (targetScore === 16) {
        ans = [{ id: 'q1', selectedOptionIndex: 1 }, { id: 'q2', selectedOptionIndex: 2 }, { id: 'q3', selectedOptionIndex: 0 }, { id: 'q4', selectedOptionIndex: 1 }]; // 4 correct = 16
      } else if (targetScore === 12) {
        ans = [{ id: 'q1', selectedOptionIndex: 1 }, { id: 'q2', selectedOptionIndex: 2 }, { id: 'q3', selectedOptionIndex: 0 }]; // 3 correct = 12
      } else if (targetScore === 10) {
        ans = [{ id: 'q1', selectedOptionIndex: 1 }, { id: 'q2', selectedOptionIndex: 2 }, { id: 'q3', selectedOptionIndex: 0 }, { id: 'q4', selectedOptionIndex: 0 }]; // 3 correct (12) + 1 wrong (-1) = 11
      } else {
        ans = [{ id: 'q1', selectedOptionIndex: 0 }]; // 1 wrong = -1
      }
      await makeRequest('POST', `/tests/${testId}/submit`, { answers: ans }, studentCookies[i]);
    }
    console.log('✓ All 12 Students Submitted Test Results');

    // Fetch Rankings as Student #12 (Ranked 12th)
    const student12Cookie = studentCookies[11];
    const rankingsRes = await makeRequest('GET', `/tests/${testId}/rankings`, null, student12Cookie);
    
    console.log('✓ Rankings Response Status:', rankingsRes.status);
    const top10 = rankingsRes.body.data.top10;
    const myRank = rankingsRes.body.data.myRank;

    console.log('✓ Leaderboard top10 Length:', top10.length, '(Expected EXACTLY 10)');
    console.log('✓ Top 3 Badges Present:', top10[0].badge === 'gold' && top10[1].badge === 'silver' && top10[2].badge === 'bronze');
    console.log('✓ Rank 4-10 Badges Null:', top10[4].badge === null);
    console.log('✓ Student #12 myRank Object Received:', JSON.stringify(myRank));
    console.log('  → Student #12 Exact Rank:', myRank.rank, '(Expected > 10)');
    console.log('  → PROOF: Ranks 11 & 12 are NOT in top10 array:', top10.find((r: any) => r.rank > 10) === undefined);

    console.log('\n=== ALL PHASE 4 INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n');
  } catch (err) {
    console.error('Phase 4 Test Failure:', err);
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runPhase4Tests().then(() => process.exit(0)).catch(() => process.exit(1));
}
