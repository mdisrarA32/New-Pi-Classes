import { User } from '../models/User';

/**
 * Generates a unique student username per formula:
 * lowercase "npc" + first 4 letters of name (lowercase) + 2-digit batch year + 2-digit sequence
 * Example: Rahul enrolled in 2026 -> npcrahu2601
 */
export async function generateStudentUsername(
  fullName: string,
  year: number = new Date().getFullYear()
): Promise<string> {
  // Extract first name and take first 4 letters
  const firstName = fullName.trim().split(/\s+/)[0] || 'student';
  const cleanName = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const prefixName = cleanName.slice(0, 4).padEnd(4, 'x');
  const yearStr = String(year).slice(-2);
  const basePrefix = `npc${prefixName}${yearStr}`;

  let sequence = 1;
  let candidate = `${basePrefix}${String(sequence).padStart(2, '0')}`;

  while (await User.exists({ username: candidate })) {
    sequence++;
    candidate = `${basePrefix}${String(sequence).padStart(2, '0')}`;
  }

  return candidate;
}
