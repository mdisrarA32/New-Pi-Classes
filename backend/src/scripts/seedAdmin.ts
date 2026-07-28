import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db';
import { User } from '../models/User';

dotenv.config();

export async function seedAdmin(): Promise<void> {
  await connectDB();

  const adminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  const adminFullName = process.env.ADMIN_FULL_NAME || 'Alam (Admin)';

  if (!adminPassword) {
    console.error('[SeedAdmin] Error: SEED_ADMIN_PASSWORD environment variable is not defined.');
    return;
  }

  const existingAdmin = await User.findOne({ username: adminUsername.toLowerCase() });

  if (existingAdmin) {
    console.log(`[SeedAdmin] Admin user '${adminUsername}' already exists.`);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await User.create({
    role: 'admin',
    fullName: adminFullName,
    username: adminUsername.toLowerCase(),
    passwordHash,
    isActive: true,
  });

  console.log(`[SeedAdmin] Admin user successfully created!`);
  console.log(`  Username: ${admin.username}`);
  console.log(`  Role: ${admin.role}`);
}

// Run directly if invoked via CLI
if (require.main === module) {
  seedAdmin().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
