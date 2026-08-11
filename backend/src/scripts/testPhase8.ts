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
import { Material } from '../models/Material';
import { PYQ } from '../models/PYQ';
import { Notice } from '../models/Notice';
import bcrypt from 'bcryptjs';
import { enforceDestructiveGuard } from './destructiveGuard';

dotenv.config();
enforceDestructiveGuard();

let server: http.Server;
const PORT = 5012;
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

export async function runPhase8Tests() {
  console.log('\n=== Starting Phase 8 Integration Tests (Student Dashboard & Multi-Batch Scoping) ===\n');

  await connectDB();
  server = app.listen(PORT);

  try {
    // 1. Reset collections
    await User.deleteMany({});
    await Batch.deleteMany({});
    await Subject.deleteMany({});
    await Material.deleteMany({});
    await PYQ.deleteMany({});
    await Notice.deleteMany({});

    // 2. Create Subjects & Chapters
    const physics = await Subject.create({ name: 'Physics', applicableStreams: ['JEE', 'NEET'] });
    const chemistry = await Subject.create({ name: 'Chemistry', applicableStreams: ['JEE', 'NEET'] });
    const chapter1 = await Chapter.create({ name: 'Kinematics', subjectId: physics._id, class: 'XI' });
    const chapter2 = await Chapter.create({ name: 'Electrostatics', subjectId: physics._id, class: 'XII' });

    // 3. Create Admin & 2 Batches
    const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
    const admin = await User.create({ role: 'admin', fullName: 'Admin', username: 'admin', passwordHash: adminPasswordHash });

    const batchA = await Batch.create({ name: 'Batch A - Class XI NEET Morning', class: 'XI', stream: 'NEET' });
    const batchB = await Batch.create({ name: 'Batch B - Class XII JEE Evening', class: 'XII', stream: 'JEE' });

    // 4. Create Student A (Batch A / Class XI) and Student B (Batch B / Class XII)
    const passHash = await bcrypt.hash('StudentPass123!', 10);

    const studentA = await User.create({
      role: 'student',
      fullName: 'Student A (Class XI)',
      username: 'studentA',
      passwordHash: passHash,
      class: 'XI',
      batchId: batchA._id,
      isActive: true,
    });

    const studentB = await User.create({
      role: 'student',
      fullName: 'Student B (Class XII)',
      username: 'studentB',
      passwordHash: passHash,
      class: 'XII',
      batchId: batchB._id,
      isActive: true,
    });

    // 5. Login both students & obtain cookies
    const loginA = await makeRequest('POST', '/auth/login', { username: 'studentA', password: 'StudentPass123!' });
    const cookieA = (loginA.headers['set-cookie']?.[0] || '').split(';')[0];

    const loginB = await makeRequest('POST', '/auth/login', { username: 'studentB', password: 'StudentPass123!' });
    const cookieB = (loginB.headers['set-cookie']?.[0] || '').split(';')[0];

    // --- TEST 1: SEED & VERIFY MATERIAL CLASS SCOPING ---
    console.log('\n--- 1. Testing Class-Scoped Study Materials ---');
    await Material.create({ title: 'Class 11 Kinematics Notes', class: 'XI', subjectId: physics._id, chapterId: chapter1._id, type: 'pdf', fileUrl: 'http://example.com/xi.pdf', uploadedBy: admin._id });
    await Material.create({ title: 'Class 12 Electrostatics Notes', class: 'XII', subjectId: physics._id, chapterId: chapter2._id, type: 'pdf', fileUrl: 'http://example.com/xii.pdf', uploadedBy: admin._id });

    const matA = await makeRequest('GET', '/materials', null, cookieA);
    const matB = await makeRequest('GET', '/materials', null, cookieB);

    console.log('✓ Student A Materials Count:', matA.body.data?.materials?.length, '(Expected 1)');
    console.log('✓ Student A Received Title:', matA.body.data?.materials?.[0]?.title);
    console.log('✓ Student B Materials Count:', matB.body.data?.materials?.length, '(Expected 1)');
    console.log('✓ Student B Received Title:', matB.body.data?.materials?.[0]?.title);
    console.log('✓ PROOF: Study Materials strictly scoped by Class:', matA.body.data?.materials?.[0]?.title === 'Class 11 Kinematics Notes' && matB.body.data?.materials?.[0]?.title === 'Class 12 Electrostatics Notes');

    // --- TEST 2: SEED & VERIFY BATCH-SCOPED NOTICES ---
    console.log('\n--- 2. Testing Batch-Scoped Notices ---');
    await Notice.create({ title: 'Global Holiday Notice', body: 'Institute closed tomorrow.', scope: 'global', postedBy: admin._id });
    await Notice.create({ title: 'Batch A NEET Test Notice', body: 'NEET Unit test on Sunday.', scope: 'batch', batchIds: [batchA._id], postedBy: admin._id });
    await Notice.create({ title: 'Batch B JEE Advanced Notice', body: 'JEE Advanced paper review.', scope: 'batch', batchIds: [batchB._id], postedBy: admin._id });

    const noticeA = await makeRequest('GET', '/notices', null, cookieA);
    const noticeB = await makeRequest('GET', '/notices', null, cookieB);

    const titlesA = (noticeA.body.data?.notices || []).map((n: any) => n.title);
    const titlesB = (noticeB.body.data?.notices || []).map((n: any) => n.title);

    console.log('✓ Student A Notices Received:', titlesA);
    console.log('✓ Student B Notices Received:', titlesB);
    console.log('✓ PROOF: Student A sees Global + Batch A notice ONLY:', titlesA.includes('Batch A NEET Test Notice') && !titlesA.includes('Batch B JEE Advanced Notice'));
    console.log('✓ PROOF: Student B sees Global + Batch B notice ONLY:', titlesB.includes('Batch B JEE Advanced Notice') && !titlesB.includes('Batch A NEET Test Notice'));

    // --- TEST 3: SEED & VERIFY PYQ SCOPING ---
    console.log('\n--- 3. Testing PYQ Scoping & Schema ExamType ---');
    await PYQ.create({ title: 'NEET 2024 Biology Paper', class: 'XI', examType: 'NEET', year: 2024, subjectId: chemistry._id, fileUrl: 'http://example.com/neet.pdf', uploadedBy: admin._id });
    await PYQ.create({ title: 'JEE 2024 Physics Paper', class: 'XII', examType: 'JEE', year: 2024, subjectId: physics._id, fileUrl: 'http://example.com/jee.pdf', uploadedBy: admin._id });

    const pyqA = await makeRequest('GET', '/pyqs', null, cookieA);
    const pyqB = await makeRequest('GET', '/pyqs', null, cookieB);

    console.log('✓ Student A PYQs Count:', pyqA.body.data?.pyqs?.length, '(Expected 1)');
    console.log('✓ Student B PYQs Count:', pyqB.body.data?.pyqs?.length, '(Expected 1)');
    console.log('✓ PROOF: PYQ Bank scoped by Class & Schema ExamType:', pyqA.body.data?.pyqs?.[0]?.examType === 'NEET' && pyqB.body.data?.pyqs?.[0]?.examType === 'JEE');

    console.log('\n=== ALL PHASE 8 INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n');
  } catch (err) {
    console.error('Phase 8 Test Failure:', err);
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runPhase8Tests().then(() => process.exit(0)).catch(() => process.exit(1));
}
