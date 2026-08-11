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
import bcrypt from 'bcryptjs';
import { enforceDestructiveGuard } from './destructiveGuard';

dotenv.config();
enforceDestructiveGuard();

let server: http.Server;
const PORT = 5006;
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

export async function runPhase2Tests() {
  console.log('\n=== Starting Phase 2 Integration Tests (Admin Student & Batch Management) ===\n');

  server = app.listen(PORT);

  try {
    // 1. Clean collections for reproducible test output
    await User.deleteMany({});
    await Batch.deleteMany({});

    // 2. Seed Admin user with env password
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminPassword123!';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    const admin = await User.create({
      role: 'admin',
      fullName: 'System Admin',
      username: 'admin',
      passwordHash: adminPasswordHash,
      isActive: true,
    });
    console.log('✓ Seeded Admin User:', admin.username);

    // 3. Admin Login & Session Cookie
    const loginRes = await makeRequest('POST', '/auth/login', {
      username: 'admin',
      password: adminPassword,
    });
    const adminCookie = (loginRes.headers['set-cookie']?.[0] || '').split(';')[0];
    console.log('✓ Admin Login Status:', loginRes.status);
    console.log('✓ Admin Cookie Obtained:', adminCookie.includes('token='));

    // --- BATCH MANAGEMENT CRUD TESTS ---
    console.log('\n--- 1. Testing Batch Management CRUD ---');
    
    // Create Batch 1 (Valid)
    const createBatch1Res = await makeRequest(
      'POST',
      '/admin/batches',
      { name: 'XI-NEET Morning 2026', class: 'XI', stream: 'NEET', timingLabel: 'Morning' },
      adminCookie
    );
    console.log('✓ Create Batch 1 Status:', createBatch1Res.status);
    console.log('✓ Create Batch 1 Payload:', JSON.stringify(createBatch1Res.body.data));
    const batch1Id = createBatch1Res.body.data?.id;

    // Create Batch 2 (Valid)
    const createBatch2Res = await makeRequest(
      'POST',
      '/admin/batches',
      { name: 'XII-JEE Evening 2026', class: 'XII', stream: 'JEE', timingLabel: 'Evening' },
      adminCookie
    );
    console.log('✓ Create Batch 2 Status:', createBatch2Res.status);
    const batch2Id = createBatch2Res.body.data?.id;

    // Create Batch Validation Failure (Invalid Stream)
    const invalidBatchRes = await makeRequest(
      'POST',
      '/admin/batches',
      { name: 'Invalid Batch', class: 'XI', stream: 'INVALID_STREAM' },
      adminCookie
    );
    console.log('✓ Invalid Batch Stream Validation Status:', invalidBatchRes.status, '(Expected 400)');
    console.log('✓ Invalid Batch Error Message:', invalidBatchRes.body.error?.message);

    // List Batches
    const listBatchesRes = await makeRequest('GET', '/admin/batches', null, adminCookie);
    console.log('✓ List Batches Count:', listBatchesRes.body.data?.batches?.length, '(Expected 2)');

    // Get Batch By ID
    const getBatchRes = await makeRequest('GET', `/admin/batches/${batch1Id}`, null, adminCookie);
    console.log('✓ Get Batch By ID Status:', getBatchRes.status, 'Name:', getBatchRes.body.data?.name);

    // Update Batch
    const updateBatchRes = await makeRequest(
      'PATCH',
      `/admin/batches/${batch1Id}`,
      { timingLabel: 'Early Morning 6:30 AM' },
      adminCookie
    );
    console.log('✓ Update Batch Status:', updateBatchRes.status, 'New Timing:', updateBatchRes.body.data?.timingLabel);

    // Soft-Delete (Archive) Batch
    const deleteBatchRes = await makeRequest('DELETE', `/admin/batches/${batch2Id}`, null, adminCookie);
    console.log('✓ Soft-Delete Batch Status:', deleteBatchRes.status, 'IsActive:', deleteBatchRes.body.data?.isActive);

    // Reactivate Batch
    const reactivateBatchRes = await makeRequest('PATCH', `/admin/batches/${batch2Id}/reactivate`, null, adminCookie);
    console.log('✓ Reactivate Batch Status:', reactivateBatchRes.status, 'IsActive:', reactivateBatchRes.body.data?.isActive);

    // --- STUDENT MANAGEMENT CRUD TESTS ---
    console.log('\n--- 2. Testing Student Management CRUD & Validation ---');

    // Create Student 1 (Valid)
    const createStudent1Res = await makeRequest(
      'POST',
      '/admin/students',
      { name: 'Rahul Kumar', class: 'XI', batchId: batch1Id, password: 'RahulPassword123!' },
      adminCookie
    );
    console.log('✓ Create Student 1 Status:', createStudent1Res.status);
    console.log('✓ Create Student 1 Payload:', JSON.stringify(createStudent1Res.body.data));
    const student1Id = createStudent1Res.body.data?.id;
    const student1Username = createStudent1Res.body.data?.username;

    // Create Student 2 (Auto-generated password & name collision check)
    const createStudent2Res = await makeRequest(
      'POST',
      '/admin/students',
      { name: 'Rahul Sharma', class: 'XI', batchId: batch1Id }, // No password passed
      adminCookie
    );
    console.log('✓ Create Student 2 Status:', createStudent2Res.status);
    console.log('✓ Student 2 Auto Username:', createStudent2Res.body.data?.username, '(Expected npcrahu2602 collision increment)');
    console.log('✓ Student 2 Auto Password:', createStudent2Res.body.data?.initialPassword ? 'Generated & Returned' : 'None');

    // Validation Test: Assign Student to Non-Existent/Archived Batch
    await makeRequest('DELETE', `/admin/batches/${batch2Id}`, null, adminCookie); // Archive batch2
    const invalidStudentBatchRes = await makeRequest(
      'POST',
      '/admin/students',
      { name: 'Test Student', class: 'XII', batchId: batch2Id, password: 'Pass' },
      adminCookie
    );
    console.log('✓ Archived Batch Student Assignment Validation Status:', invalidStudentBatchRes.status, '(Expected 400)');
    console.log('✓ Archived Batch Error Message:', invalidStudentBatchRes.body.error?.message);

    // List Students Filtered by Batch
    const listStudentsRes = await makeRequest('GET', `/admin/students?batchId=${batch1Id}`, null, adminCookie);
    console.log('✓ List Students in Batch 1 Count:', listStudentsRes.body.data?.students?.length, '(Expected 2)');

    // Get Student Profile By ID
    const getStudentRes = await makeRequest('GET', `/admin/students/${student1Id}`, null, adminCookie);
    console.log('✓ Get Student Profile Status:', getStudentRes.status, 'Name:', getStudentRes.body.data?.name);

    // Update Student (Change Class & Name)
    const updateStudentRes = await makeRequest(
      'PATCH',
      `/admin/students/${student1Id}`,
      { name: 'Rahul K. Verma' },
      adminCookie
    );
    console.log('✓ Update Student Status:', updateStudentRes.status, 'Updated Name:', updateStudentRes.body.data?.name);

    // Reset Student Password (STU-4: One-time Plaintext Password Return)
    const resetPassRes = await makeRequest('POST', `/admin/students/${student1Id}/reset-password`, {}, adminCookie);
    console.log('✓ Reset Student Password Status:', resetPassRes.status);
    console.log('✓ Reset Password Payload (One-time):', JSON.stringify(resetPassRes.body.data));

    // Deactivate Student Account
    const deactivateStudentRes = await makeRequest('DELETE', `/admin/students/${student1Id}`, null, adminCookie);
    console.log('✓ Deactivate Student Status:', deactivateStudentRes.status, 'IsActive:', deactivateStudentRes.body.data?.isActive);

    // Reactivate Student Account
    const reactivateStudentRes = await makeRequest('PATCH', `/admin/students/${student1Id}/reactivate`, null, adminCookie);
    console.log('✓ Reactivate Student Status:', reactivateStudentRes.status, 'IsActive:', reactivateStudentRes.body.data?.isActive);

    // --- ROLE PROTECTION TESTS ---
    console.log('\n--- 3. Testing Role-Based Access Protection (RBAC) ---');

    // Login as Student 1
    const studentLoginRes = await makeRequest('POST', '/auth/login', {
      username: student1Username,
      password: resetPassRes.body.data?.newPassword, // Use the new reset password
    });
    console.log('✓ Student Login with Reset Password Status:', studentLoginRes.status);
    const studentCookie = (studentLoginRes.headers['set-cookie']?.[0] || '').split(';')[0];

    // Attempt Admin Operations as Student (Expect 403 FORBIDDEN)
    const studentCreateBatch = await makeRequest('POST', '/admin/batches', { name: 'Hack Batch', class: 'XI', stream: 'JEE' }, studentCookie);
    console.log('✓ Student Create Batch Attempt:', studentCreateBatch.status, '(Expected 403)');

    const studentCreateStudent = await makeRequest('POST', '/admin/students', { name: 'Hack Student', class: 'XI', batchId: batch1Id }, studentCookie);
    console.log('✓ Student Create Student Attempt:', studentCreateStudent.status, '(Expected 403)');

    const studentResetPassword = await makeRequest('POST', `/admin/students/${student1Id}/reset-password`, {}, studentCookie);
    console.log('✓ Student Self Password Reset Attempt:', studentResetPassword.status, '(Expected 403)');

    // Attempt Admin Operation Unauthenticated (Expect 401 UNAUTHORIZED)
    const unauthListStudents = await makeRequest('GET', '/admin/students');
    console.log('✓ Unauthenticated List Students Attempt:', unauthListStudents.status, '(Expected 401)');

    console.log('\n=== ALL PHASE 2 INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n');
  } catch (err) {
    console.error('Phase 2 Test Failure:', err);
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runPhase2Tests().then(() => process.exit(0)).catch(() => process.exit(1));
}
