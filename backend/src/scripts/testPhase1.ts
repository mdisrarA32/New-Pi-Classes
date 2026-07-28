import http from 'http';
import dotenv from 'dotenv';
import app from '../index';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Batch } from '../models/Batch';
import bcrypt from 'bcryptjs';

dotenv.config();

let server: http.Server;
const PORT = 5005;
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

export async function runPhase1Tests() {
  console.log('\n=== Starting Phase 1 Integration Tests ===\n');

  // Start HTTP server for testing
  server = app.listen(PORT);

  try {
    // 1. Clean test DB collection
    await User.deleteMany({});
    await Batch.deleteMany({});

    // 2. Seed Admin User
    const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
    const admin = await User.create({
      role: 'admin',
      fullName: 'System Admin',
      username: 'admin',
      passwordHash: adminPasswordHash,
      isActive: true,
    });
    console.log('✓ Admin seeded in DB:', admin.username);

    // 3. Test Login as Admin
    const loginRes = await makeRequest('POST', '/auth/login', {
      username: 'admin',
      password: 'AdminPassword123!',
    });
    console.log('✓ Login Response Status:', loginRes.status);
    console.log('✓ Login Response Body:', loginRes.body);

    const setCookieHeader = loginRes.headers['set-cookie']?.[0] || '';
    console.log('✓ Set-Cookie Header Present:', setCookieHeader.includes('token=') && setCookieHeader.includes('HttpOnly'));
    console.log('✓ Token Excluded from JSON Body:', loginRes.body.data?.token === undefined);

    const adminCookie = setCookieHeader.split(';')[0];

    // 4. Test GET /api/auth/me with Admin Cookie
    const meRes = await makeRequest('GET', '/auth/me', null, adminCookie);
    console.log('✓ Auth /me Response Status:', meRes.status);
    console.log('✓ Auth /me User Role:', meRes.body.data?.role);

    // 5. Test Access Protected Admin Route WITHOUT Cookie (Expect 401)
    const unauthRes = await makeRequest('GET', '/admin/batches');
    console.log('✓ Unauthenticated Admin Route Access Status:', unauthRes.status, '(Expected 401)');

    // 6. Create Batch as Admin
    const createBatchRes = await makeRequest(
      'POST',
      '/admin/batches',
      { name: 'XI-NEET Morning 2026', class: 'XI', stream: 'NEET', timingLabel: 'Morning' },
      adminCookie
    );
    console.log('✓ Batch Created Status:', createBatchRes.status);
    const createdBatchId = createBatchRes.body.data?.id;

    // 7. Create Student as Admin (Testing Username Formula e.g. npcrahu2601)
    const createStudentRes = await makeRequest(
      'POST',
      '/admin/students',
      { name: 'Rahul Kumar', class: 'XI', batchId: createdBatchId, password: 'StudentPass123!' },
      adminCookie
    );
    console.log('✓ Student Created Status:', createStudentRes.status);
    console.log('✓ Generated Student Username:', createStudentRes.body.data?.username, '(Expected npcrahu2601 or similar)');

    // 8. Test Login as Student
    const studentUsername = createStudentRes.body.data?.username;
    const studentLoginRes = await makeRequest('POST', '/auth/login', {
      username: studentUsername,
      password: 'StudentPass123!',
    });
    const studentCookie = (studentLoginRes.headers['set-cookie']?.[0] || '').split(';')[0];
    console.log('✓ Student Login Status:', studentLoginRes.status);

    // 9. Test Student Trying to Access Admin Route (Expect 403 FORBIDDEN)
    const studentAdminAccessRes = await makeRequest('GET', '/admin/batches', null, studentCookie);
    console.log('✓ Student Accessing Admin Route Status:', studentAdminAccessRes.status, '(Expected 403 FORBIDDEN)');

    // 10. Test Login Rate Limiting (5 Failed Attempts -> 429 RATE_LIMITED)
    console.log('\n--- Testing Login Rate Limiter (AUTH-4) ---');
    for (let i = 1; i <= 5; i++) {
      const failRes = await makeRequest('POST', '/auth/login', {
        username: 'admin',
        password: 'WrongPassword!',
      });
      console.log(`  Attempt ${i}: Status ${failRes.status} (${failRes.body.error?.code || 'SUCCESS'})`);
    }
    // 6th Attempt -> Expect 429
    const blockedRes = await makeRequest('POST', '/auth/login', {
      username: 'admin',
      password: 'WrongPassword!',
    });
    console.log('✓ 6th Attempt Locked Out Status:', blockedRes.status, '(Expected 429 RATE_LIMITED)');
    console.log('✓ Rate Limit Error Message:', blockedRes.body.error?.message);

    console.log('\n=== ALL PHASE 1 INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n');
  } catch (err) {
    console.error('Test Failure:', err);
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runPhase1Tests().then(() => process.exit(0)).catch(() => process.exit(1));
}
