import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db';
import { User } from '../models/User';

dotenv.config();

async function resetAdminPassword(): Promise<void> {
  // Accept password from CLI arg or environment variable
  const newPassword = process.argv[2] || process.env.NEW_ADMIN_PASSWORD;

  if (!newPassword) {
    console.error('[ResetAdmin] Error: No password provided.');
    console.error('  Usage:  npx tsx src/scripts/resetAdminPassword.ts <NEW_PASSWORD>');
    console.error('  Or set: NEW_ADMIN_PASSWORD=<password> in environment');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('[ResetAdmin] Error: Password must be at least 8 characters.');
    process.exit(1);
  }

  await connectDB();

  const admin = await User.findOne({ username: 'admin', role: 'admin' });

  if (!admin) {
    console.error('[ResetAdmin] Error: Admin user with username "admin" not found in database.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  admin.passwordHash = passwordHash;
  await admin.save();

  console.log('[ResetAdmin] ✅ Admin password reset successfully!');
  console.log(`  Username: ${admin.username}`);
  console.log(`  Password updated to the value you provided.`);
}

resetAdminPassword().then(() => process.exit(0)).catch((err) => {
  console.error('[ResetAdmin] Fatal error:', err);
  process.exit(1);
});
