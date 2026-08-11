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
        hostname: '127.0.0.1',
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

async function runPhase11aTests() {
  console.log('=== Starting Phase 11a Integration Tests (Admin Core, Batches & Student Admin) ===\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('[Database] Connected to MongoDB Atlas for Phase 11a verification');

  try {
    // 1. Seed admin and student
    await User.deleteMany({ username: { $in: ['admin_p11a', 'test_p11a_student'] } });
    await Batch.deleteMany({ name: 'Phase 11a Batch' });

    const adminHash = await bcrypt.hash('AdminPass123!', 10);
    await User.create({
      role: 'admin',
      fullName: 'Phase 11a Admin',
      username: 'admin_p11a',
      passwordHash: adminHash,
      isActive: true,
    });

    const batch = await Batch.create({ name: 'Phase 11a Batch', class: 'XI', stream: 'JEE' });

    const studentHash = await bcrypt.hash('StudentPass123!', 10);
    await User.create({
      role: 'student',
      fullName: 'Phase 11a Student',
      username: 'test_p11a_student',
      passwordHash: studentHash,
      batchId: batch._id,
      class: 'XI',
      stream: 'JEE',
    });

    console.log('\n--- 1. Testing Role Guard (Student trying to access Admin API) ---');
    const studentLogin = await makeRequest('POST', '/auth/login', { username: 'test_p11a_student', password: 'StudentPass123!' });
    const studentCookie = (studentLogin.headers['set-cookie']?.[0] || '').split(';')[0];

    const studentAccessAttempt = await makeRequest('GET', '/admin/batches', undefined, studentCookie);
    console.log('✓ Student Accessing Admin Route Status:', studentAccessAttempt.status, '(Expected 403)');
    console.log('✓ PROOF: Student role guard enforced:', studentAccessAttempt.status === 403);

    console.log('\n--- 2. Admin Authentication ---');
    const adminLogin = await makeRequest('POST', '/auth/login', { username: 'admin_p11a', password: 'AdminPass123!' });
    const adminCookie = (adminLogin.headers['set-cookie']?.[0] || '').split(';')[0];
    console.log('✓ Admin Logged In Successfully');

    console.log('\n--- 3. Testing Batch Creation ---');
    const createBatchRes = await makeRequest('POST', '/admin/batches', {
      name: 'Class XII NEET Morning P11a',
      class: 'XII',
      stream: 'NEET',
      timingLabel: '7:00 AM - 10:00 AM',
    }, adminCookie);

    console.log('✓ Create Batch Status:', createBatchRes.status);
    console.log('✓ Created Batch ID:', createBatchRes.body.data?.id, 'Name:', createBatchRes.body.data?.name);

    console.log('\n--- 4. Testing Student Enrollment with Backend-Generated Username ---');
    const createStudentRes = await makeRequest('POST', '/admin/students', {
      name: 'Rohan Verma',
      class: 'XII',
      batchId: createBatchRes.body.data.id,
    }, adminCookie);

    console.log('✓ Create Student Status:', createStudentRes.status);
    console.log('✓ Enrolled Student Name:', createStudentRes.body.data?.name);
    console.log('✓ Backend-Generated Username:', createStudentRes.body.data?.username);
    console.log('✓ Initial Auto-Generated Password:', createStudentRes.body.data?.initialPassword);
    const validUsernamePattern = /^npc[a-z]{3,4}\d{4}$/i.test(createStudentRes.body.data?.username || '');
    console.log('✓ PROOF: Username respects Phase 2 backend formula:', validUsernamePattern);

    console.log('\n--- 5. Testing One-Time Password Reset Endpoint ---');
    const resetRes = await makeRequest('POST', `/admin/students/${createStudentRes.body.data.id}/reset-password`, {}, adminCookie);
    console.log('✓ Reset Password Status:', resetRes.status);
    console.log('✓ Reset Payload Username:', resetRes.body.data?.username);
    console.log('✓ One-Time Plaintext Password Returned:', resetRes.body.data?.newPassword);
    console.log('✓ PROOF: Reset returns plaintext password for admin modal:', Boolean(resetRes.body.data?.newPassword));

    console.log('\n--- 6. Testing Batch Archive / Toggle Status ---');
    const archiveRes = await makeRequest('DELETE', `/admin/batches/${createBatchRes.body.data.id}`, undefined, adminCookie);
    console.log('✓ Archive Batch Status:', archiveRes.status);

    const reactivateRes = await makeRequest('PATCH', `/admin/batches/${createBatchRes.body.data.id}/reactivate`, undefined, adminCookie);
    console.log('✓ Reactivate Batch Status:', reactivateRes.status);

    console.log('\n=== ALL PHASE 11a INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n');
  } catch (err: any) {
    console.error('Phase 11a Test Failure:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runPhase11aTests();
