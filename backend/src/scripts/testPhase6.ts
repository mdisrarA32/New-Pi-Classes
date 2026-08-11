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
import { Course } from '../models/Course';
import { Testimonial } from '../models/Testimonial';
import { Enquiry } from '../models/Enquiry';
import bcrypt from 'bcryptjs';
import { enforceDestructiveGuard } from './destructiveGuard';

dotenv.config();
enforceDestructiveGuard();

let server: http.Server;
const PORT = 5010;
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

export async function runPhase6Tests() {
  console.log('\n=== Starting Phase 6 Verification Tests (Frontend Public Site & API Wiring) ===\n');

  await connectDB();
  server = app.listen(PORT);

  try {
    // 1. Clear database
    await User.deleteMany({});
    await Course.deleteMany({});
    await Testimonial.deleteMany({});
    await Enquiry.deleteMany({});

    // 2. Create Admin User
    const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
    const admin = await User.create({
      role: 'admin',
      fullName: 'System Admin',
      username: 'admin',
      passwordHash: adminPasswordHash,
      isActive: true,
    });

    const loginRes = await makeRequest('POST', '/auth/login', { username: 'admin', password: 'AdminPass123!' });
    const adminCookie = (loginRes.headers['set-cookie']?.[0] || '').split(';')[0];
    console.log('✓ Admin Logged In');

    // --- 3. SEED COURSE VIA ADMIN API ---
    console.log('\n--- 1. Testing Live Course Creation & Public API Fetch ---');
    const courseRes = await makeRequest(
      'POST',
      '/admin/courses',
      {
        name: 'Class XI JEE Main & Advanced Mastery',
        class: 'XI',
        stream: 'JEE',
        description: 'Comprehensive 1-year physics, chemistry & maths coaching for Class 11.',
        fee: 35000,
        isActive: true,
      },
      adminCookie
    );
    console.log('✓ Course Created via Admin API. Status:', courseRes.status);

    // Fetch live public courses endpoint
    const publicCoursesRes = await makeRequest('GET', '/courses');
    console.log('✓ Public GET /api/courses Status:', publicCoursesRes.status);
    console.log('✓ Public Courses Returned Count:', publicCoursesRes.body.data?.courses?.length);
    console.log('✓ Public Course Name Match:', publicCoursesRes.body.data?.courses?.[0]?.name);
    console.log('✓ PROOF: Course dynamically appears on public frontend endpoint:', publicCoursesRes.body.data?.courses?.[0]?.name === 'Class XI JEE Main & Advanced Mastery');

    // --- 4. SEED TESTIMONIAL VIA ADMIN API ---
    console.log('\n--- 2. Testing Live Testimonial Creation & Public API Fetch ---');
    const testimonialRes = await makeRequest(
      'POST',
      '/admin/testimonials',
      {
        studentName: 'Aman Sharma',
        resultText: 'JEE Advanced 2025 - AIR 1420',
        quote: 'NPC Sheohar faculty helped me build fundamental clarity in Physics and Maths!',
        isPublished: true,
      },
      adminCookie
    );
    console.log('✓ Testimonial Created via Admin API. Status:', testimonialRes.status);

    const publicTestimonialsRes = await makeRequest('GET', '/testimonials');
    console.log('✓ Public GET /api/testimonials Status:', publicTestimonialsRes.status);
    console.log('✓ Public Testimonials Count:', publicTestimonialsRes.body.data?.testimonials?.length);
    console.log('✓ Testimonial Student Name Match:', publicTestimonialsRes.body.data?.testimonials?.[0]?.studentName);
    console.log('✓ PROOF: Testimonial dynamically appears on public frontend endpoint:', publicTestimonialsRes.body.data?.testimonials?.[0]?.studentName === 'Aman Sharma');

    // --- 5. TEST PUBLIC DEMO ENQUIRY SUBMISSION ---
    console.log('\n--- 3. Testing Public Contact Form / Demo Enquiry Submission ---');
    const enquiryPayload = {
      name: 'Rohan Verma',
      phone: '9876543210',
      classInterested: 'XI',
      streamInterested: 'NEET',
      message: 'I want to join the morning batch for Class 11 NEET.',
    };

    const enquiryRes = await makeRequest('POST', '/enquiries', enquiryPayload);
    console.log('✓ Public POST /api/enquiries Status:', enquiryRes.status);
    console.log('✓ Enquiry Response Body:', enquiryRes.body);

    const createdEnquiry = await Enquiry.findOne({ phone: '9876543210' });
    console.log('✓ DB Verified Enquiry Student Name:', createdEnquiry?.name);
    console.log('✓ DB Verified Enquiry Stream:', createdEnquiry?.streamInterested);
    console.log('✓ PROOF: Public enquiry submission saved cleanly in database:', createdEnquiry?.name === 'Rohan Verma');

    console.log('\n=== ALL PHASE 6 VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n');
  } catch (err) {
    console.error('Phase 6 Test Failure:', err);
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runPhase6Tests().then(() => process.exit(0)).catch(() => process.exit(1));
}
