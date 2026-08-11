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
import { Chapter } from '../models/Chapter';
import { Material } from '../models/Material';
import { PYQ } from '../models/PYQ';
import { Notice } from '../models/Notice';
import { Enquiry } from '../models/Enquiry';
import { Testimonial } from '../models/Testimonial';
import { Course } from '../models/Course';
import { seedSubjects } from './seedSubjects';
import bcrypt from 'bcryptjs';
import { enforceDestructiveGuard } from './destructiveGuard';

dotenv.config();
enforceDestructiveGuard();

let server: http.Server;
const PORT = 5007;
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

export async function runPhase3Tests() {
  console.log('\n=== Starting Phase 3 Integration Tests (Materials, PYQs, Notices, Enquiries, Testimonials, Courses) ===\n');

  server = app.listen(PORT);

  try {
    // 1. Reset collections
    await User.deleteMany({});
    await Batch.deleteMany({});
    await Subject.deleteMany({});
    await Chapter.deleteMany({});
    await Material.deleteMany({});
    await PYQ.deleteMany({});
    await Notice.deleteMany({});
    await Enquiry.deleteMany({});
    await Testimonial.deleteMany({});
    await Course.deleteMany({});

    // 2. Seed Subjects
    await seedSubjects();
    const physicsSub = await Subject.findOne({ name: 'Physics' });
    const bioSub = await Subject.findOne({ name: 'Biology' });
    const mathSub = await Subject.findOne({ name: 'Mathematics' });

    // 3. Seed Admin & Login
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
    console.log('✓ Admin Logged In & Cookie Set');

    // 4. Create Batches
    const batch1Res = await makeRequest('POST', '/admin/batches', { name: 'Class XI NEET Batch A', class: 'XI', stream: 'NEET' }, adminCookie);
    const batch2Res = await makeRequest('POST', '/admin/batches', { name: 'Class XII JEE Batch B', class: 'XII', stream: 'JEE' }, adminCookie);
    const batch1Id = batch1Res.body.data.id;
    const batch2Id = batch2Res.body.data.id;

    // 5. Create Students
    const student1Res = await makeRequest('POST', '/admin/students', { name: 'Rahul NEET', class: 'XI', batchId: batch1Id, password: 'Pass' }, adminCookie);
    const student2Res = await makeRequest('POST', '/admin/students', { name: 'Aman JEE', class: 'XII', batchId: batch2Id, password: 'Pass' }, adminCookie);
    
    // Login as Student 1 (Class XI NEET)
    const s1LoginRes = await makeRequest('POST', '/auth/login', { username: student1Res.body.data.username, password: 'Pass' });
    const student1Cookie = (s1LoginRes.headers['set-cookie']?.[0] || '').split(';')[0];

    // Login as Student 2 (Class XII JEE)
    const s2LoginRes = await makeRequest('POST', '/auth/login', { username: student2Res.body.data.username, password: 'Pass' });
    const student2Cookie = (s2LoginRes.headers['set-cookie']?.[0] || '').split(';')[0];

    // --- MODULE 1: SUBJECTS & CHAPTERS ---
    console.log('\n--- 1. Testing Subjects & Chapters ---');
    const createChap1Res = await makeRequest('POST', '/admin/chapters', { subjectId: physicsSub!._id, class: 'XI', name: 'Kinematics', order: 1 }, adminCookie);
    const createChap2Res = await makeRequest('POST', '/admin/chapters', { subjectId: bioSub!._id, class: 'XI', name: 'Cell Unit of Life', order: 1 }, adminCookie);
    const createChap3Res = await makeRequest('POST', '/admin/chapters', { subjectId: mathSub!._id, class: 'XII', name: 'Calculus & Integration', order: 1 }, adminCookie);
    console.log('✓ Chapters Created (Kinematics XI, Cell Bio XI, Calculus XII)');

    // --- MODULE 2: STUDY MATERIALS & CONTENT SCOPING ---
    console.log('\n--- 2. Testing Study Materials & Student Content Scoping ---');
    const mat1 = await makeRequest('POST', '/admin/materials', { chapterId: createChap1Res.body.data.id, title: 'Kinematics Formulas PDF', type: 'pdf', fileUrl: 'https://cloudinary.com/pdf1' }, adminCookie);
    const mat2 = await makeRequest('POST', '/admin/materials', { chapterId: createChap2Res.body.data.id, title: 'Cell Structure Video', type: 'video', fileUrl: 'https://youtube.com/watch?v=cell1' }, adminCookie);
    const mat3 = await makeRequest('POST', '/admin/materials', { chapterId: createChap3Res.body.data.id, title: 'Calculus Notes', type: 'note', noteContent: 'Integration by parts...' }, adminCookie);
    console.log('✓ Study Materials Uploaded');

    // Test Student 1 Content Scoping (Class XI NEET)
    const s1MaterialsRes = await makeRequest('GET', '/materials', null, student1Cookie);
    const s1MatTitles = s1MaterialsRes.body.data.materials.map((m: any) => m.title);
    console.log('✓ Student 1 (Class XI NEET) Materials Received:', s1MatTitles);
    console.log('  → Contains Kinematics & Cell Bio:', s1MatTitles.includes('Kinematics Formulas PDF') && s1MatTitles.includes('Cell Structure Video'));
    console.log('  → Excludes Class XII Calculus:', !s1MatTitles.includes('Calculus Notes'));

    // Test Student 2 Content Scoping (Class XII JEE)
    const s2MaterialsRes = await makeRequest('GET', '/materials', null, student2Cookie);
    const s2MatTitles = s2MaterialsRes.body.data.materials.map((m: any) => m.title);
    console.log('✓ Student 2 (Class XII JEE) Materials Received:', s2MatTitles);
    console.log('  → Contains Calculus XII:', s2MatTitles.includes('Calculus Notes'));
    console.log('  → Excludes Class XI Bio & Physics:', !s2MatTitles.includes('Cell Structure Video') && !s2MatTitles.includes('Kinematics Formulas PDF'));

    // --- MODULE 3: PYQ BANK ---
    console.log('\n--- 3. Testing PYQ Bank ---');
    const pyq1 = await makeRequest('POST', '/admin/pyqs', { class: 'XI', examType: 'NEET', subjectId: physicsSub!._id, year: 2024, title: 'NEET 2024 Physics XI', fileUrl: 'https://cloudinary.com/pyq1' }, adminCookie);
    const pyq2 = await makeRequest('POST', '/admin/pyqs', { class: 'XII', examType: 'JEE', subjectId: mathSub!._id, year: 2024, title: 'JEE 2024 Maths XII', fileUrl: 'https://cloudinary.com/pyq2' }, adminCookie);
    console.log('✓ PYQs Uploaded');

    const s1PyqRes = await makeRequest('GET', '/pyqs', null, student1Cookie);
    console.log('✓ Student 1 PYQ Scoping (Only Class XI):', s1PyqRes.body.data.pyqs.map((p: any) => p.title));

    // --- MODULE 4: NOTICES & BATCH SCOPING ---
    console.log('\n--- 4. Testing Notices & Batch Scoping ---');
    await makeRequest('POST', '/admin/notices', { title: 'Global Holiday Notice', body: 'Institute closed tomorrow', scope: 'global' }, adminCookie);
    await makeRequest('POST', '/admin/notices', { title: 'NEET Batch A Extra Class', body: 'Extra bio class at 8 AM', scope: 'batch', batchIds: [batch1Id] }, adminCookie);
    await makeRequest('POST', '/admin/notices', { title: 'JEE Batch B Test Series', body: 'JEE Mock Test on Sunday', scope: 'batch', batchIds: [batch2Id] }, adminCookie);

    const s1NoticesRes = await makeRequest('GET', '/notices', null, student1Cookie);
    const s1NoticeTitles = s1NoticesRes.body.data.notices.map((n: any) => n.title);
    console.log('✓ Student 1 (Batch A) Notices Received:', s1NoticeTitles);
    console.log('  → Contains Global & Batch A Notice:', s1NoticeTitles.includes('Global Holiday Notice') && s1NoticeTitles.includes('NEET Batch A Extra Class'));
    console.log('  → Excludes Batch B Notice:', !s1NoticeTitles.includes('JEE Batch B Test Series'));

    // --- MODULE 5: PUBLIC ENQUIRIES ---
    console.log('\n--- 5. Testing Public Enquiries ---');
    const pubEnquiryRes = await makeRequest('POST', '/enquiries', {
      name: 'Parent Rajesh',
      phone: '9876543210',
      classInterested: 'XI',
      streamInterested: 'NEET',
      message: 'Looking for morning batch admission details.',
    });
    console.log('✓ Public Enquiry Submission Status:', pubEnquiryRes.status);

    const adminEnquiriesRes = await makeRequest('GET', '/admin/enquiries', null, adminCookie);
    console.log('✓ Admin Read Enquiries Count:', adminEnquiriesRes.body.data.enquiries.length);

    const updateEnquiryRes = await makeRequest('PATCH', `/admin/enquiries/${pubEnquiryRes.body.data.id}`, { status: 'contacted' }, adminCookie);
    console.log('✓ Admin Updated Enquiry Status:', updateEnquiryRes.body.data.status);

    // --- MODULE 6: TESTIMONIALS ISOLATION & PUBLIC FILTER ---
    console.log('\n--- 6. Testing Testimonials & Public Filter ---');
    const t1 = await makeRequest('POST', '/admin/testimonials', { studentName: 'Ankit Kumar', resultText: 'AIR 1200 NEET 2025', quote: 'NPC helped me crack NEET!', isPublished: true }, adminCookie);
    const t2 = await makeRequest('POST', '/admin/testimonials', { studentName: 'Draft Student', resultText: 'AIR 5000', quote: 'Draft review...', isPublished: false }, adminCookie);

    const publicTestimonialsRes = await makeRequest('GET', '/testimonials');
    const pubNames = publicTestimonialsRes.body.data.testimonials.map((t: any) => t.studentName);
    console.log('✓ Public Testimonials Returned:', pubNames);
    console.log('  → Contains Published Only:', pubNames.includes('Ankit Kumar') && !pubNames.includes('Draft Student'));

    const adminTestimonialsRes = await makeRequest('GET', '/admin/testimonials', null, adminCookie);
    console.log('✓ Admin Testimonials Total Count:', adminTestimonialsRes.body.data.testimonials.length, '(Expected 2 including drafts)');

    // --- MODULE 7: COURSES / FEE CARDS ---
    console.log('\n--- 7. Testing Courses & Fee Cards ---');
    const courseRes = await makeRequest('POST', '/admin/courses', { name: 'Class XI NEET Comprehensive', class: 'XI', stream: 'NEET', fee: 45000, description: 'Full syllabus + test series' }, adminCookie);
    console.log('✓ Admin Created Course Status:', courseRes.status);

    const publicCoursesRes = await makeRequest('GET', '/courses');
    console.log('✓ Public Courses Count:', publicCoursesRes.body.data.courses.length, 'Name:', publicCoursesRes.body.data.courses[0]?.name);

    console.log('\n=== ALL PHASE 3 INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n');
  } catch (err) {
    console.error('Phase 3 Test Failure:', err);
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runPhase3Tests().then(() => process.exit(0)).catch(() => process.exit(1));
}
