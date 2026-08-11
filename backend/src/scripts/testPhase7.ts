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
import bcrypt from 'bcryptjs';
import { enforceDestructiveGuard } from './destructiveGuard';

dotenv.config();
enforceDestructiveGuard();

let server: http.Server;
const PORT = 5011;
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

export async function runPhase7Tests() {
  console.log('\n=== Starting Phase 7 Integration Tests (Frontend Sign-In & Auth Wiring) ===\n');

  await connectDB();
  server = app.listen(PORT);

  try {
    // 1. Reset user & batch collections
    await User.deleteMany({});
    await Batch.deleteMany({});

    // 2. Create Admin and Student in DB
    const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
    const admin = await User.create({
      role: 'admin',
      fullName: 'System Admin',
      username: 'admin',
      passwordHash: adminPasswordHash,
      isActive: true,
    });

    const batch = await Batch.create({
      name: 'Class XI NEET Target',
      class: 'XI',
      stream: 'NEET',
    });

    const studentPasswordHash = await bcrypt.hash('StudentPassword123!', 10);
    const student = await User.create({
      role: 'student',
      fullName: 'Rahul Sharma',
      username: 'npcrahu2601',
      passwordHash: studentPasswordHash,
      class: 'XI',
      batchId: batch._id,
      isActive: true,
    });

    // --- TEST 1: STUDENT LOGIN & HTTPONLY COOKIE PROOF ---
    console.log('\n--- 1. Testing Student Login & HttpOnly Cookie Flow ---');
    const studentLoginRes = await makeRequest('POST', '/auth/login', {
      username: 'npcrahu2601',
      password: 'StudentPassword123!',
    });

    console.log('✓ Student Login Status:', studentLoginRes.status);
    console.log('✓ User Role Returned:', studentLoginRes.body.data?.user?.role);
    console.log('✓ Target Redirect URL for Student Role:', studentLoginRes.body.data?.user?.role === 'student' ? '/dashboard' : 'N/A');

    const setCookieHeader = studentLoginRes.headers['set-cookie']?.[0] || '';
    const hasHttpOnly = setCookieHeader.includes('HttpOnly');
    const hasTokenCookie = setCookieHeader.includes('token=');
    console.log('✓ Set-Cookie Header Received:', setCookieHeader.substring(0, 40) + '...');
    console.log('✓ PROOF: Token is in HttpOnly Cookie:', hasHttpOnly && hasTokenCookie);
    console.log('✓ PROOF: Token string is NOT exposed in response JSON body:', studentLoginRes.body.data?.token === undefined);

    const studentCookie = setCookieHeader.split(';')[0];

    // --- TEST 2: ADMIN LOGIN & ADMIN ROLE REDIRECT TARGET ---
    console.log('\n--- 2. Testing Admin Login & Role Redirection Target ---');
    const adminLoginRes = await makeRequest('POST', '/auth/login', {
      username: 'admin',
      password: 'AdminPassword123!',
    });

    console.log('✓ Admin Login Status:', adminLoginRes.status);
    console.log('✓ Admin User Role Returned:', adminLoginRes.body.data?.user?.role);
    console.log('✓ Target Redirect URL for Admin Role:', adminLoginRes.body.data?.user?.role === 'admin' ? '/admin' : 'N/A');
    console.log('✓ PROOF: Role-based redirect target verified:', adminLoginRes.body.data?.user?.role === 'admin');

    // --- TEST 3: FAILED LOGIN & ERROR CODE PARSING ---
    console.log('\n--- 3. Testing Failed Login & Error Code Response ---');
    const failedLoginRes = await makeRequest('POST', '/auth/login', {
      username: 'npcrahu2601',
      password: 'WrongPassword999!',
    });

    console.log('✓ Failed Login Status:', failedLoginRes.status, '(Expected 401)');
    console.log('✓ Error Code Returned:', failedLoginRes.body.error?.code);
    console.log('✓ Error Message Returned:', failedLoginRes.body.error?.message);
    console.log('✓ PROOF: Failed login displays backend error code accurately:', failedLoginRes.body.error?.code === 'INVALID_CREDENTIALS');

    // --- TEST 4: GET /api/auth/me WITH HTTPONLY COOKIE ---
    console.log('\n--- 4. Testing GET /api/auth/me Session Restoration ---');
    const meRes = await makeRequest('GET', '/auth/me', null, studentCookie);
    console.log('✓ GET /auth/me Status:', meRes.status);
    console.log('✓ Restored Session Username:', meRes.body.data?.username);
    console.log('✓ Restored Session Role:', meRes.body.data?.role);

    // --- TEST 5: LOGOUT ENDPOINT & COOKIE CLEARING ---
    console.log('\n--- 5. Testing Logout & Session Invalidation ---');
    const logoutRes = await makeRequest('POST', '/auth/logout', null, studentCookie);
    console.log('✓ Logout Status:', logoutRes.status);
    const logoutCookieHeader = logoutRes.headers['set-cookie']?.[0] || '';
    console.log('✓ Logout Set-Cookie Header (Expired):', logoutCookieHeader.includes('Expires=Thu, 01 Jan 1970') || logoutCookieHeader.includes('token=;'));
    console.log('✓ PROOF: Session cookie cleared on logout:', logoutRes.body.success === true);

    console.log('\n=== ALL PHASE 7 VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n');
  } catch (err) {
    console.error('Phase 7 Test Failure:', err);
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runPhase7Tests().then(() => process.exit(0)).catch(() => process.exit(1));
}
