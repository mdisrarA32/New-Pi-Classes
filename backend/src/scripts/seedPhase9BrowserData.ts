/**
 * ⚠️ WARNING: THIS TEST SCRIPT RUNS DESTRUCTIVELY ON THE DATABASE.
 * Running this script will execute deleteMany({}) and clear data
 * (including Users, Batches, Subjects, etc.) from whatever database
 * MONGO_URI points to in your .env configuration.
 *
 * Ensure you are NOT running this against a production or populated
 * development database.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Batch } from '../models/Batch';
import { Subject } from '../models/Subject';
import { Test } from '../models/Test';
import { Result } from '../models/Result';
import { enforceDestructiveGuard } from './destructiveGuard';

dotenv.config();
enforceDestructiveGuard();

async function seedPhase9BrowserData() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('[Database] Connected for Phase 9 Browser Seeding');

  // Clear existing Phase 9 browser test data safely
  await User.deleteMany({ username: { $regex: /^browser_student/ } });
  await Batch.deleteMany({ name: 'Phase 9 Browser Batch' });
  await Subject.deleteMany({ name: 'Phase 9 Physics' });
  await Test.deleteMany({ title: 'Phase 9 Live Browser Mock Test' });

  // 1. Create Batch & Subject
  const batch = await Batch.create({
    name: 'Phase 9 Browser Batch',
    class: 'XI',
    stream: 'NEET',
  });

  const subject = await Subject.create({
    name: 'Phase 9 Physics',
    applicableStreams: ['NEET'],
  });

  // 2. Create Admin User (for createdBy)
  const passHash = await bcrypt.hash('StudentPass123!', 10);
  const admin = await User.create({
    role: 'admin',
    fullName: 'Admin Seeder',
    username: 'browser_admin',
    passwordHash: passHash,
  });

  // 3. Create Primary Test Student (browser_student1)
  const student1 = await User.create({
    role: 'student',
    fullName: 'Rahul Sharma (Student 1)',
    username: 'browser_student1',
    passwordHash: passHash,
    batchId: batch._id,
    class: 'XI',
    stream: 'NEET',
  });

  // 4. Create 10 dummy top students for rankings leaderboard (Top 10)
  const topStudents = [];
  for (let i = 2; i <= 11; i++) {
    const s = await User.create({
      role: 'student',
      fullName: `Rank ${i - 1} Student ${i}`,
      username: `browser_student${i}`,
      passwordHash: passHash,
      batchId: batch._id,
      class: 'XI',
      stream: 'NEET',
    });
    topStudents.push(s);
  }

  // 5. Create Student 12 (Rank 12 for privacy check)
  const student12 = await User.create({
    role: 'student',
    fullName: 'Hidden Student 12',
    username: 'browser_student12',
    passwordHash: passHash,
    batchId: batch._id,
    class: 'XI',
    stream: 'NEET',
  });

  // 6. Create Active Test
  const now = new Date();
  const test = await Test.create({
    title: 'Phase 9 Live Browser Mock Test',
    batchIds: [batch._id],
    subjectIds: [subject._id],
    durationMinutes: 60,
    scheduledAt: new Date(now.getTime() - 1000 * 60 * 5), // Started 5 mins ago
    negativeMarkingRatio: 0.25,
    createdBy: admin._id,
    questions: [
      { id: 'q1', text: 'What is the SI unit of Force?', options: ['Pascal', 'Newton', 'Joule', 'Watt'], correctOptionIndex: 1, marks: 4 },
      { id: 'q2', text: 'Velocity is defined as rate of change of?', options: ['Distance', 'Displacement', 'Speed', 'Acceleration'], correctOptionIndex: 1, marks: 4 },
      { id: 'q3', text: 'Acceleration due to gravity near Earth surface is approx?', options: ['9.8 m/s^2', '10 m/s', '9.8 N', '9.8 m/s^3'], correctOptionIndex: 0, marks: 4 },
      { id: 'q4', text: 'Is work a scalar or vector quantity?', options: ['Scalar', 'Vector', 'Tensor', 'None'], correctOptionIndex: 0, marks: 4 },
      { id: 'q5', text: 'Power is equal to?', options: ['Work * Time', 'Work / Time', 'Force * Acceleration', 'Mass * Velocity'], correctOptionIndex: 1, marks: 4 },
    ],
  });

  // 7. Seed Results for Top 10 students (Scores: 20 down to 2)
  for (let idx = 0; idx < topStudents.length; idx++) {
    const score = 20 - idx * 2;
    await Result.create({
      testId: test._id,
      studentId: topStudents[idx]._id,
      answers: [],
      score: score,
      correctCount: Math.floor(score / 4),
      incorrectCount: 0,
      unattemptedCount: 5 - Math.floor(score / 4),
      submittedAt: new Date(now.getTime() - 1000 * 60 * 2),
    });
  }

  // 8. Seed Result for Student 12 (Score: 0)
  await Result.create({
    testId: test._id,
    studentId: student12._id,
    answers: [],
    score: 0,
    correctCount: 0,
    incorrectCount: 0,
    unattemptedCount: 5,
    submittedAt: new Date(now.getTime() - 1000 * 60 * 1),
  });

  console.log('=== PHASE 9 BROWSER DATA SEEDED SUCCESSFULLY ===');
  console.log(`Student Username: browser_student1`);
  console.log(`Student Password: StudentPass123!`);
  console.log(`Test ID: ${test._id.toString()}`);

  await mongoose.disconnect();
}

seedPhase9BrowserData().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
