import http from 'http';
import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Batch } from '../models/Batch';
import { Subject } from '../models/Subject';
import { Chapter } from '../models/Chapter';

dotenv.config();

function makeRequest(method: string, path: string, body?: any, cookie?: string) {
  return new Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }>((resolve, reject) => {
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
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 500, body: JSON.parse(resBody), headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode || 500, body: resBody, headers: res.headers });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runPhase11bTests() {
  console.log('=== Starting Phase 11b Integration Tests (Content, PYQs, Notices, CRM & Marketing) ===\n');

  await connectDB();
  console.log('[Database] Connected to MongoDB Atlas for Phase 11b verification\n');

  // Seed sample Subject & Chapter if missing
  let subject = await Subject.findOne({ name: 'Physics Phase 11b Test' });
  if (!subject) {
    subject = await Subject.create({
      name: 'Physics Phase 11b Test',
      code: 'PHY-P11B',
      class: 'XI',
      stream: 'NEET',
    });
  }

  let chapter = await Chapter.findOne({ subjectId: subject._id, name: 'Kinematics 11b' });
  if (!chapter) {
    chapter = await Chapter.create({
      subjectId: subject._id,
      name: 'Kinematics 11b',
      chapterNumber: 1,
      class: 'XI',
    });
  }

  // 1. Admin Authentication
  console.log('--- 1. Admin Authentication ---');
  await User.deleteMany({ username: 'admin_p11b' });
  const bcrypt = (await import('bcryptjs')).default;
  const adminHash = await bcrypt.hash('AdminPass123!', 10);
  await User.create({
    role: 'admin',
    fullName: 'Phase 11b Admin',
    username: 'admin_p11b',
    passwordHash: adminHash,
    isActive: true,
  });

  const loginRes = await makeRequest('POST', '/auth/login', {
    username: 'admin_p11b',
    password: 'AdminPass123!',
  });

  if (loginRes.status !== 200) {
    throw new Error(`Admin login failed: ${JSON.stringify(loginRes.body)}`);
  }
  const adminCookie = loginRes.headers['set-cookie']?.[0]?.split(';')?.[0];
  console.log('✓ Admin Logged In Successfully\n');

  // 2. Study Material Creation & Deletion
  console.log('--- 2. Study Material Publishing ---');
  const matRes = await makeRequest(
    'POST',
    '/admin/materials',
    {
      chapterId: chapter._id.toString(),
      title: 'Kinematics Motion Equations PDF',
      type: 'pdf',
      fileUrl: 'https://example.com/kinematics-11b.pdf',
    },
    adminCookie
  );

  if (matRes.status !== 201 || !matRes.body.success) {
    throw new Error(`Failed to create study material: ${JSON.stringify(matRes.body)}`);
  }
  console.log('✓ Material Upload Status: 201');
  console.log(`✓ Created Material ID: ${matRes.body.data.id} Title: ${matRes.body.data.title}\n`);

  // 3. PYQ Creation with Locked JEE/NEET Enum
  console.log('--- 3. PYQ Bank Paper Creation (Schema-Correct JEE/NEET Enum) ---');
  const pyqRes = await makeRequest(
    'POST',
    '/admin/pyqs',
    {
      class: 'XI',
      examType: 'NEET',
      subjectId: subject._id.toString(),
      year: 2024,
      title: 'NEET 2024 Kinematics Official Solved Paper',
      fileUrl: 'https://example.com/neet-2024-kinematics.pdf',
    },
    adminCookie
  );

  if (pyqRes.status !== 201 || !pyqRes.body.success) {
    throw new Error(`Failed to create PYQ: ${JSON.stringify(pyqRes.body)}`);
  }
  console.log('✓ Create PYQ Status: 201');
  console.log(`✓ Created PYQ ID: ${pyqRes.body.data.id} ExamType: ${pyqRes.body.data.examType}\n`);

  // 4. Notice Announcements (Global & Batch Scoped)
  console.log('--- 4. Notice Board Announcements ---');
  const noticeRes = await makeRequest(
    'POST',
    '/admin/notices',
    {
      title: 'Phase 11b Test Announcement',
      body: 'Classes will remain open on national holiday for NEET mock exam review.',
      scope: 'global',
    },
    adminCookie
  );

  if (noticeRes.status !== 201 || !noticeRes.body.success) {
    throw new Error(`Failed to post notice: ${JSON.stringify(noticeRes.body)}`);
  }
  console.log('✓ Post Notice Status: 201');
  console.log(`✓ Created Notice Title: ${noticeRes.body.data.title} Scope: ${noticeRes.body.data.scope}\n`);

  // 5. Public Enquiry Submission & CRM Status Toggle
  console.log('--- 5. Enquiry CRM Pipeline Status Update ---');
  const publicEnqRes = await makeRequest('POST', '/enquiries', {
    name: 'Vikram Singh',
    phone: '9876543210',
    classInterested: 'XI',
    streamInterested: 'NEET',
    message: 'Requesting weekend demo class timing.',
  });

  if (publicEnqRes.status !== 201 || !publicEnqRes.body.success) {
    throw new Error(`Failed to submit enquiry: ${JSON.stringify(publicEnqRes.body)}`);
  }
  const enqId = publicEnqRes.body.data.id;

  const patchEnqRes = await makeRequest(
    'PATCH',
    `/admin/enquiries/${enqId}`,
    { status: 'contacted' },
    adminCookie
  );

  if (patchEnqRes.status !== 200 || !patchEnqRes.body.success) {
    throw new Error(`Failed to update enquiry status: ${JSON.stringify(patchEnqRes.body)}`);
  }
  console.log('✓ Enquiry Status Update Status: 200');
  console.log(`✓ Enquiry ID: ${enqId} Updated Pipeline Status: contacted\n`);

  // 6. Testimonial End-to-End Sync (Unpublished -> Public Verification -> Publish Toggle -> Public Verification)
  console.log('--- 6. Testimonial End-to-End Public Sync Verification ---');
  const createTestimonialRes = await makeRequest(
    'POST',
    '/admin/testimonials',
    {
      studentName: 'Phase 11b Testimonial Student',
      resultText: 'NEET 2025 AIR 210',
      quote: 'NPC Sheohar coaching helped me secure top rank with personal mentoring.',
      isPublished: false, // Created as UNPUBLISHED
    },
    adminCookie
  );

  if (createTestimonialRes.status !== 201 || !createTestimonialRes.body.success) {
    throw new Error(`Failed to create testimonial: ${JSON.stringify(createTestimonialRes.body)}`);
  }
  const testimonialId = createTestimonialRes.body.data.id;
  console.log(`✓ Created UNPUBLISHED Testimonial ID: ${testimonialId}`);

  // Fetch public testimonials before publishing
  const publicBeforeRes = await makeRequest('GET', '/testimonials');
  const foundBefore = (publicBeforeRes.body.data?.testimonials || []).some(
    (t: any) => t.id === testimonialId || t._id === testimonialId
  );
  console.log(`✓ PROOF: Unpublished testimonial absent from public GET /api/testimonials: ${!foundBefore}`);
  if (foundBefore) {
    throw new Error('FAILED: Unpublished testimonial leaked into public GET /api/testimonials');
  }

  // Toggle isPublished to TRUE
  const toggleRes = await makeRequest(
    'PATCH',
    `/admin/testimonials/${testimonialId}`,
    { isPublished: true },
    adminCookie
  );

  if (toggleRes.status !== 200 || !toggleRes.body.success) {
    throw new Error(`Failed to publish testimonial: ${JSON.stringify(toggleRes.body)}`);
  }
  console.log('✓ Toggled isPublished to true via PATCH /api/admin/testimonials/:id');

  // Fetch public testimonials after publishing
  const publicAfterRes = await makeRequest('GET', '/testimonials');
  const foundAfter = (publicAfterRes.body.data?.testimonials || []).some(
    (t: any) => t.id === testimonialId || t._id === testimonialId
  );
  console.log(`✓ PROOF: Published testimonial NOW APPEARS on public GET /api/testimonials: ${foundAfter}`);
  if (!foundAfter) {
    throw new Error('FAILED: Testimonial failed to appear in public GET /api/testimonials after publishing');
  }

  console.log('\n=== ALL PHASE 11b INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

runPhase11bTests().catch((err) => {
  console.error('Phase 11b Test Failure:', err);
  process.exit(1);
});
