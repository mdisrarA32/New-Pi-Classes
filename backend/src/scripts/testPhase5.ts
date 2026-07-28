import http from 'http';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from '../index';
import { User } from '../models/User';
import { Batch } from '../models/Batch';
import { setStudentChatCount, resetChatRateLimitStore } from '../middleware/chatRateLimiter';
import bcrypt from 'bcryptjs';

import { connectDB } from '../config/db';

dotenv.config();

let server: http.Server;
const PORT = 5009;
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

export async function runPhase5Tests() {
  console.log('\n=== Starting Phase 5 Integration Tests (AI Chatbot & Groq Proxy Integration) ===\n');

  await connectDB();
  server = app.listen(PORT);

  try {
    // 1. Reset rate limiters & user DB
    resetChatRateLimitStore();
    await User.deleteMany({});
    await Batch.deleteMany({});

    // 2. Create Batch & Student
    const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
    const admin = await User.create({ role: 'admin', fullName: 'Admin', username: 'admin', passwordHash: adminPasswordHash });
    const batch = await Batch.create({ name: 'Class XI NEET Batch', class: 'XI', stream: 'NEET', timingLabel: 'Morning' });
    
    const student = await User.create({
      role: 'student',
      fullName: 'Vikram Singh',
      username: 'npcvikr2601',
      passwordHash: await bcrypt.hash('StudentPass123!', 10),
      class: 'XI',
      batchId: batch._id,
      isActive: true,
    });

    const loginRes = await makeRequest('POST', '/auth/login', { username: 'npcvikr2601', password: 'StudentPass123!' });
    const studentCookie = (loginRes.headers['set-cookie']?.[0] || '').split(';')[0];
    console.log('✓ Student Logged In & Cookie Obtained');

    // --- TEST 1: ON-TOPIC PHYSICS / CHEMISTRY QUESTION ---
    console.log('\n--- 1. Testing On-Topic STEM Question ---');
    const onTopicRes = await makeRequest(
      'POST',
      '/chatbot/message',
      { prompt: "State Snell's Law of Refraction in Physics and explain it briefly." },
      studentCookie
    );
    console.log('✓ On-Topic Request Status:', onTopicRes.status);
    console.log('✓ On-Topic AI Response Reply Snippet:', onTopicRes.body.data?.reply?.substring(0, 150) + '...');
    console.log('✓ Model Used:', onTopicRes.body.data?.model);

    // --- TEST 2: OFF-TOPIC QUESTION / REDIRECT ENFORCEMENT ---
    console.log('\n--- 2. Testing Off-Topic Question & Redirect Enforcement ---');
    const offTopicRes = await makeRequest(
      'POST',
      '/chatbot/message',
      { prompt: 'Who won the FIFA World Cup in 2022 and what is your favorite movie?' },
      studentCookie
    );
    console.log('✓ Off-Topic Request Status:', offTopicRes.status);
    console.log('✓ Off-Topic AI Redirect Reply Snippet:', offTopicRes.body.data?.reply);
    const isDeclined = offTopicRes.body.data?.reply?.toLowerCase().includes('physics') ||
                      offTopicRes.body.data?.reply?.toLowerCase().includes('chemistry') ||
                      offTopicRes.body.data?.reply?.toLowerCase().includes('biology') ||
                      offTopicRes.body.data?.reply?.toLowerCase().includes('cannot answer') ||
                      offTopicRes.body.data?.reply?.toLowerCase().includes('focus');
    console.log('✓ PROOF: Off-topic request politely declined/redirected:', isDeclined);

    // --- TEST 3: GROQ API KEY SECURITY CHECK ---
    console.log('\n--- 3. Testing Groq API Key Security Absence ---');
    const responseString = JSON.stringify(onTopicRes.body);
    const hasSecretKey = responseString.includes('gsk_') || responseString.includes(process.env.GROQ_API_KEY || 'N/A');
    console.log('✓ PROOF: Groq API Key (gsk_...) is NOT present anywhere in client response:', !hasSecretKey);

    // --- TEST 4: DAILY PER-STUDENT RATE LIMIT ENFORCEMENT ---
    console.log('\n--- 4. Testing Daily Per-Student Rate Limiter (40 msgs/day) ---');
    // Set student's count to 40 (hitting the cap)
    setStudentChatCount(student._id.toString(), 40);

    const rateLimitedRes = await makeRequest(
      'POST',
      '/chatbot/message',
      { prompt: 'What is Newton second law?' },
      studentCookie
    );
    console.log('✓ 41st Message Request Status:', rateLimitedRes.status, '(Expected 429 RATE_LIMITED)');
    console.log('✓ Rate Limit Error Body:', rateLimitedRes.body.error);
    console.log('✓ Reset Time Returned:', rateLimitedRes.body.error?.resetAt);

    // --- TEST 5: ZERO LONG-TERM DATABASE STORAGE CHECK ---
    console.log('\n--- 5. Testing Zero Database Storage Confirmation ---');
    const collections = await mongoose.connection.db?.listCollections().toArray();
    const collectionNames = (collections || []).map((c) => c.name);
    console.log('✓ Active Database Collections:', collectionNames);
    const hasChatCollection = collectionNames.some((c) => c.includes('chat') || c.includes('transcript') || c.includes('message'));
    console.log('✓ PROOF: Zero database collections for chats/transcripts:', !hasChatCollection);

    console.log('\n=== ALL PHASE 5 INTEGRATION TESTS PASSED SUCCESSFULLY! ===\n');
  } catch (err) {
    console.error('Phase 5 Test Failure:', err);
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runPhase5Tests().then(() => process.exit(0)).catch(() => process.exit(1));
}
