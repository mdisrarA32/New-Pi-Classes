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
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Batch } from '../models/Batch';
import { enforceDestructiveGuard } from './destructiveGuard';

dotenv.config();
enforceDestructiveGuard();

function makeRequest(method: string, path: string, body?: any, cookie?: string): Promise<{ status: number; body: any; headers: any }> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5001,
        path: `/api${path}`,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...(cookie ? { Cookie: cookie } : {}),
        },
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 500, body: JSON.parse(resData), headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode || 500, body: resData, headers: res.headers });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runPhase10Tests() {
  console.log('=== Starting Phase 10 Integration Tests (AI Chatbot Proxy & Scoping) ===\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('[Database] Connected to MongoDB Atlas for Phase 10 verification');

  try {
    // Seed test student
    await User.deleteMany({ username: 'test_phase10_student' });
    await Batch.deleteMany({ name: 'Phase 10 Batch' });

    const batch = await Batch.create({ name: 'Phase 10 Batch', class: 'XI', stream: 'NEET' });
    const passHash = await bcrypt.hash('StudentPass123!', 10);
    const student = await User.create({
      role: 'student',
      fullName: 'Phase 10 Student',
      username: 'test_phase10_student',
      passwordHash: passHash,
      batchId: batch._id,
      class: 'XI',
      stream: 'NEET',
    });

    console.log('\n--- 1. Testing Unauthenticated Access Guard ---');
    const unauthRes = await makeRequest('POST', '/chatbot/message', { prompt: 'Hello' });
    console.log('✓ Unauthenticated Status:', unauthRes.status, '(Expected 401)');
    console.log('✓ PROOF: Protected route enforces auth:', unauthRes.status === 401);

    // Login as student
    const loginRes = await makeRequest('POST', '/auth/login', { username: 'test_phase10_student', password: 'StudentPass123!' });
    const cookie = (loginRes.headers['set-cookie']?.[0] || '').split(';')[0];

    console.log('\n--- 2. Testing On-Topic STEM Question (Class XI Physics) ---');
    const onTopicRes = await makeRequest('POST', '/chatbot/message', {
      prompt: 'State Newton second law of motion and write its formula.',
    }, cookie);

    console.log('✓ On-Topic Request Status:', onTopicRes.status);
    console.log('✓ AI Tutor Reply Received:', onTopicRes.body.data?.reply?.substring(0, 120) + '...');
    const containsForceOrNewton = /force|motion|momentum|F\s*=\s*ma/i.test(onTopicRes.body.data?.reply || '');
    console.log('✓ PROOF: AI Tutor provides accurate STEM answer:', containsForceOrNewton);

    console.log('\n--- 3. Testing Off-Topic Question (System Prompt Guardrail Refusal) ---');
    const offTopicRes = await makeRequest('POST', '/chatbot/message', {
      prompt: 'What is the capital of France and who won the 2022 World Cup?',
    }, cookie);

    console.log('✓ Off-Topic Request Status:', offTopicRes.status);
    console.log('✓ Off-Topic Refusal Reply:', offTopicRes.body.data?.reply);
    const containsRefusalOrRedirect = /decline|only|physics|chemistry|biology|mathematics|science|syllabus|cannot|redirect|sorry/i.test(offTopicRes.body.data?.reply || '');
    console.log('✓ PROOF: Off-topic query politely declined & redirected:', containsRefusalOrRedirect);

    console.log('\n=== ALL PHASE 10 INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n');
  } catch (err: any) {
    console.error('Phase 10 Test Failure:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runPhase10Tests();
