import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { Subject } from '../models/Subject';

dotenv.config();

export async function seedSubjects() {
  await connectDB();

  const defaultSubjects = [
    { name: 'Physics', applicableStreams: ['JEE', 'NEET', 'Foundation'] },
    { name: 'Chemistry', applicableStreams: ['JEE', 'NEET', 'Foundation'] },
    { name: 'Biology', applicableStreams: ['NEET', 'Foundation'] },
    { name: 'Mathematics', applicableStreams: ['JEE', 'Foundation'] },
  ];

  for (const s of defaultSubjects) {
    const existing = await Subject.findOne({ name: s.name });
    if (!existing) {
      await Subject.create(s);
      console.log(`✓ Seeded subject: ${s.name}`);
    } else {
      console.log(`- Subject '${s.name}' already exists.`);
    }
  }
}

if (require.main === module) {
  seedSubjects().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
