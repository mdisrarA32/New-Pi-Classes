const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface CourseData {
  _id: string;
  id?: string;
  name?: string;
  title?: string;
  class: 'XI' | 'XII' | 'Target';
  stream: 'JEE' | 'NEET' | 'Foundation' | 'Board';
  description: string;
  fee: number;
  durationMonths?: number;
  isActive: boolean;
  createdAt?: string;
}

export interface TestimonialData {
  _id: string;
  id?: string;
  studentName: string;
  resultText?: string;
  examCleared?: string;
  rankAchieved?: string;
  quote?: string;
  testimonialText?: string;
  photoUrl?: string;
  isPublished: boolean;
  year?: string;
}

export interface EnquiryPayload {
  name: string;
  phone: string;
  classInterested: 'XI' | 'XII' | 'Target';
  streamInterested: 'JEE' | 'NEET' | 'Foundation';
  message?: string;
}

/**
 * Fetch all active courses from backend
 */
export async function getCourses(): Promise<CourseData[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/courses`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.success ? json.data.courses : [];
  } catch (error) {
    console.error('[API Error] Fetch courses failed:', error);
    // Fallback try on port 5001 if default fails
    try {
      const resFallback = await fetch('http://localhost:5001/api/courses', {
        next: { revalidate: 60 },
      });
      const json = await resFallback.json();
      return json.success ? json.data.courses : [];
    } catch {
      return [];
    }
  }
}

/**
 * Fetch published testimonials from backend
 */
export async function getTestimonials(): Promise<TestimonialData[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/testimonials`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.success ? json.data.testimonials : [];
  } catch (error) {
    console.error('[API Error] Fetch testimonials failed:', error);
    try {
      const resFallback = await fetch('http://localhost:5001/api/testimonials', {
        next: { revalidate: 60 },
      });
      const json = await resFallback.json();
      return json.success ? json.data.testimonials : [];
    } catch {
      return [];
    }
  }
}

/**
 * Submit public student enquiry
 */
export async function submitEnquiry(
  payload: EnquiryPayload
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    let url = `${API_BASE_URL}/enquiries`;
    let res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok && res.status !== 400 && res.status !== 429) {
      // Fallback try 5001
      res = await fetch('http://localhost:5001/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    const json = await res.json();
    if (json.success) {
      return { success: true, message: json.message || 'Enquiry submitted successfully!' };
    } else {
      return { success: false, error: json.error?.message || 'Failed to submit enquiry' };
    }
  } catch (error: any) {
    console.error('[API Error] Submit enquiry failed:', error);
    return { success: false, error: 'Network error. Please try again later.' };
  }
}

export interface UserSession {
  id: string;
  role: 'student' | 'admin';
  fullName: string;
  username: string;
  class?: string;
  batchId?: string;
}

/**
 * Login user via POST /api/auth/login
 * Browser automatically stores the HttpOnly JWT cookie returned in Set-Cookie header.
 */
export async function loginUser(
  username: string,
  password: string
): Promise<{ success: boolean; data?: UserSession; error?: { code: string; message: string } }> {
  const tryUrls = [
    `${API_BASE_URL}/auth/login`,
    'http://localhost:5001/api/auth/login',
    'http://localhost:5000/api/auth/login',
  ];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();
      if (json.success) {
        return { success: true, data: json.data.user };
      } else if (res.status === 400 || res.status === 401 || res.status === 429) {
        return {
          success: false,
          error: {
            code: json.error?.code || 'LOGIN_FAILED',
            message: json.error?.message || 'Invalid username or password',
          },
        };
      }
    } catch (err) {
      // Continue to next fallback URL
    }
  }

  return {
    success: false,
    error: { code: 'NETWORK_ERROR', message: 'Unable to connect to authentication server' },
  };
}

/**
 * Logout user via POST /api/auth/logout
 * Clears HttpOnly session cookie.
 */
export async function logoutUser(): Promise<{ success: boolean }> {
  const tryUrls = [
    `${API_BASE_URL}/auth/logout`,
    'http://localhost:5001/api/auth/logout',
    'http://localhost:5000/api/auth/logout',
  ];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) return { success: true };
    } catch (err) {
      // Continue
    }
  }

  return { success: false };
}

/**
 * Fetch current authenticated user via GET /api/auth/me
 */
export async function getMe(): Promise<{ success: boolean; user?: UserSession }> {
  const tryUrls = [
    `${API_BASE_URL}/auth/me`,
    'http://localhost:5001/api/auth/me',
    'http://localhost:5000/api/auth/me',
  ];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (res.status === 401) {
        return { success: false };
      }

      const json = await res.json();
      if (json.success && json.data) {
        return { success: true, user: json.data };
      }
    } catch (err) {
      // Continue
    }
  }

  return { success: false };
}

export interface MaterialItem {
  id: string;
  title: string;
  type: 'pdf' | 'video';
  fileUrl?: string;
  videoUrl?: string;
  class: 'XI' | 'XII';
  subject: { id: string; name: string };
  chapter?: { id: string; name: string };
  createdAt: string;
}

export interface PYQItem {
  id: string;
  title: string;
  examType: 'JEE' | 'NEET';
  class: 'XI' | 'XII';
  year: number;
  subject: { id: string; name: string };
  chapter?: { id: string; name: string };
  fileUrl: string;
  createdAt: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  body: string;
  scope: 'global' | 'batch';
  batchIds: string[];
  postedBy: string;
  createdAt: string;
}

export interface TestListItem {
  id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'upcoming' | 'active' | 'ended';
  hasSubmitted: boolean;
  questionCount: number;
}

export interface TestQuestion {
  id: string;
  text: string;
  options: string[];
  marks: number;
}

export interface TestAttemptPayload {
  testId: string;
  title: string;
  durationMinutes: number;
  remainingSeconds: number;
  questions: TestQuestion[];
  submitted?: boolean;
}

export interface TestReviewQuestion {
  id: string;
  text: string;
  options: string[];
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  isCorrect: boolean;
  isUnattempted: boolean;
}

export interface TestResultPayload {
  testId: string;
  title: string;
  score: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  submittedAt: string;
  autoSubmitted: boolean;
  review: TestReviewQuestion[];
}

export interface LeaderboardEntry {
  rank: number;
  fullName: string;
  username: string;
  score: number;
  tiebreakerReason?: string;
}

export interface TestRankingsPayload {
  testId: string;
  title: string;
  top10: LeaderboardEntry[];
  myRank?: number | { rank: number; score: number } | null;
  myScore?: number;
  totalParticipants: number;
}

/**
 * Fetch student assigned tests (scoped to student's batch)
 */
export async function getStudentTests(): Promise<TestListItem[]> {
  const tryUrls = [
    `${API_BASE_URL}/tests`,
    'http://localhost:5001/api/tests',
    'http://localhost:5000/api/tests',
  ];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data.tests || [];
      }
    } catch (e) {
      // Try next
    }
  }
  return [];
}

/**
 * Fetch questions for test attempt
 */
export async function getTestAttempt(
  testId: string
): Promise<{ success: boolean; data?: TestAttemptPayload; error?: { code: string; message: string } }> {
  const tryUrls = [
    `${API_BASE_URL}/tests/${testId}/attempt`,
    `http://localhost:5001/api/tests/${testId}/attempt`,
    `http://localhost:5000/api/tests/${testId}/attempt`,
  ];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        return { success: true, data: json.data };
      } else if (res.status === 400 || res.status === 403 || res.status === 404) {
        return {
          success: false,
          error: {
            code: json.error?.code || 'ATTEMPT_ERROR',
            message: json.error?.message || 'Unable to start test attempt.',
          },
        };
      }
    } catch (e) {
      // Try next
    }
  }

  return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to connect to server.' } };
}

/**
 * Submit test answers
 */
export async function submitTestAttempt(
  testId: string,
  answers: { questionId: string; selectedOptionIndex: number | null }[],
  autoSubmitted = false
): Promise<{ success: boolean; data?: any; error?: { code: string; message: string } }> {
  const tryUrls = [
    `${API_BASE_URL}/tests/${testId}/submit`,
    `http://localhost:5001/api/tests/${testId}/submit`,
    `http://localhost:5000/api/tests/${testId}/submit`,
  ];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answers, autoSubmitted }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        return { success: true, data: json.data };
      } else if (res.status === 400 || res.status === 403) {
        return {
          success: false,
          error: {
            code: json.error?.code || 'SUBMIT_ERROR',
            message: json.error?.message || 'Submission failed.',
          },
        };
      }
    } catch (e) {
      // Try next
    }
  }

  return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to connect to server.' } };
}

/**
 * Fetch test result for student
 */
export async function getTestResult(
  testId: string
): Promise<{ success: boolean; data?: TestResultPayload; error?: { code: string; message: string } }> {
  const tryUrls = [
    `${API_BASE_URL}/tests/${testId}/result`,
    `http://localhost:5001/api/tests/${testId}/result`,
    `http://localhost:5000/api/tests/${testId}/result`,
  ];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        return { success: true, data: json.data };
      }
    } catch (e) {
      // Try next
    }
  }

  return { success: false, error: { code: 'NOT_FOUND', message: 'Result not found.' } };
}

/**
 * Fetch test rankings leaderboard
 */
export async function getTestRankings(
  testId: string
): Promise<{ success: boolean; data?: TestRankingsPayload; error?: { code: string; message: string } }> {
  const tryUrls = [
    `${API_BASE_URL}/tests/${testId}/rankings`,
    `http://localhost:5001/api/tests/${testId}/rankings`,
    `http://localhost:5000/api/tests/${testId}/rankings`,
  ];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        return { success: true, data: json.data };
      }
    } catch (e) {
      // Try next
    }
  }

  return { success: false, error: { code: 'NOT_FOUND', message: 'Rankings not found.' } };
}

/**
 * Fetch student study materials (scoped to student class/stream)
 */
export async function getStudentMaterials(): Promise<MaterialItem[]> {
  const tryUrls = [
    `${API_BASE_URL}/materials`,
    'http://localhost:5001/api/materials',
    'http://localhost:5000/api/materials',
  ];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data.materials || [];
      }
    } catch (e) {
      // Try next
    }
  }
  return [];
}

/**
 * Fetch student PYQs (scoped to student class)
 */
export async function getStudentPYQs(): Promise<PYQItem[]> {
  const tryUrls = [
    `${API_BASE_URL}/pyqs`,
    'http://localhost:5001/api/pyqs',
    'http://localhost:5000/api/pyqs',
  ];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data.pyqs || [];
      }
    } catch (e) {
      // Try next
    }
  }
  return [];
}

/**
 * Fetch student notices (scoped to global OR student's batchId)
 */
export async function getStudentNotices(): Promise<NoticeItem[]> {
  const tryUrls = [
    `${API_BASE_URL}/notices`,
    'http://localhost:5001/api/notices',
    'http://localhost:5000/api/notices',
  ];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data.notices || [];
      }
    } catch (e) {
      // Try next
    }
  }
  return [];
}

export interface ChatMessagePayload {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  timestamp?: string;
  isError?: boolean;
}

export interface ChatResponse {
  success: boolean;
  reply?: string;
  error?: {
    code: string;
    message: string;
    resetAt?: string;
  };
}

/**
 * Send message to AI Tutor backend proxy (POST /api/chatbot/message)
 * Never calls Groq directly from client-side JS.
 */
export async function sendChatMessage(
  prompt: string,
  history: ChatMessagePayload[] = []
): Promise<ChatResponse> {
  const tryUrls = [
    `${API_BASE_URL}/chatbot/message`,
    'http://localhost:5001/api/chatbot/message',
    'http://localhost:5000/api/chatbot/message',
  ];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt, history }),
      });

      const json = await res.json();

      if (res.status === 429) {
        return {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: json.error?.message || 'Daily AI Tutor message limit reached (40/40).',
            resetAt: json.error?.resetAt,
          },
        };
      }

      if (json.success && json.data) {
        return {
          success: true,
          reply: json.data.reply,
        };
      } else if (json.error) {
        return {
          success: false,
          error: {
            code: json.error.code || 'CHATBOT_ERROR',
            message: json.error.message || 'AI Tutor is temporarily unavailable.',
          },
        };
      }
    } catch (e) {
      // Try next
    }
  }

  return {
    success: false,
    error: {
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to AI Tutor server.',
    },
  };
}

/* ==========================================================================
   ADMIN MANAGEMENT API HELPERS (PHASE 11a)
   ========================================================================== */

export interface AdminBatchItem {
  id: string;
  name: string;
  class: 'XI' | 'XII';
  stream: 'JEE' | 'NEET' | 'Foundation';
  timingLabel?: string;
  isActive: boolean;
  studentCount: number;
  createdAt: string;
}

export interface AdminStudentItem {
  id: string;
  fullName: string;
  username: string;
  class: string;
  batchId?: string;
  batchName?: string;
  stream?: string;
  isActive: boolean;
  createdAt?: string;
}

/**
 * Fetch all batches for admin (with optional includeArchived=true)
 */
export async function getAdminBatches(includeArchived = true): Promise<AdminBatchItem[]> {
  const url = `${API_BASE_URL}/admin/batches?includeArchived=${includeArchived}`;
  const tryUrls = [url, `http://localhost:5001/api/admin/batches?includeArchived=${includeArchived}`];

  for (const targetUrl of tryUrls) {
    try {
      const res = await fetch(targetUrl, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data?.batches) {
        return json.data.batches;
      }
    } catch (e) {
      // Try next
    }
  }
  return [];
}

/**
 * Create a new batch
 */
export async function createAdminBatch(payload: {
  name: string;
  class: 'XI' | 'XII';
  stream: 'JEE' | 'NEET' | 'Foundation';
  timingLabel?: string;
}): Promise<{ success: boolean; data?: AdminBatchItem; error?: string }> {
  const tryUrls = [`${API_BASE_URL}/admin/batches`, 'http://localhost:5001/api/admin/batches'];

  for (const targetUrl of tryUrls) {
    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data) {
        return { success: true, data: json.data };
      } else if (json.error) {
        return { success: false, error: json.error.message || 'Failed to create batch' };
      }
    } catch (e) {
      // Try next
    }
  }

  return { success: false, error: 'Unable to connect to server.' };
}

/**
 * Toggle batch active status (Archive / Reactivate)
 */
export async function toggleBatchStatus(batchId: string, currentlyActive: boolean): Promise<boolean> {
  const endpoint = currentlyActive ? `/admin/batches/${batchId}` : `/admin/batches/${batchId}/reactivate`;
  const method = currentlyActive ? 'DELETE' : 'PATCH';
  const tryUrls = [`${API_BASE_URL}${endpoint}`, `http://localhost:5001/api${endpoint}`];

  for (const targetUrl of tryUrls) {
    try {
      const res = await fetch(targetUrl, { method, credentials: 'include' });
      const json = await res.json();
      if (json.success) return true;
    } catch (e) {
      // Try next
    }
  }
  return false;
}

/**
 * Fetch student directory for admin
 */
export async function getAdminStudents(params?: {
  batchId?: string;
  class?: string;
  status?: 'active' | 'inactive' | 'all';
  search?: string;
  limit?: string;
  page?: string;
}): Promise<{ students: AdminStudentItem[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.batchId) searchParams.set('batchId', params.batchId);
  if (params?.class) searchParams.set('class', params.class);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.limit) searchParams.set('limit', params.limit);
  if (params?.page) searchParams.set('page', params.page);

  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const tryUrls = [
    `${API_BASE_URL}/admin/students${queryStr}`,
    `http://localhost:5001/api/admin/students${queryStr}`,
  ];

  for (const targetUrl of tryUrls) {
    try {
      const res = await fetch(targetUrl, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        return {
          students: json.data.students || [],
          total: json.data.total || json.data.students?.length || 0,
        };
      }
    } catch (e) {
      // Try next
    }
  }

  return { students: [], total: 0 };
}

/**
 * Create a new student (returns exact backend-generated username e.g. npcrahu2601)
 */
export async function createAdminStudent(payload: {
  name: string;
  class: 'XI' | 'XII';
  batchId: string;
  password?: string;
}): Promise<{
  success: boolean;
  data?: {
    id: string;
    name: string;
    username: string;
    class: string;
    batchId: string;
    initialPassword?: string;
  };
  error?: string;
}> {
  const tryUrls = [`${API_BASE_URL}/admin/students`, 'http://localhost:5001/api/admin/students'];

  for (const targetUrl of tryUrls) {
    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data) {
        return { success: true, data: json.data };
      } else if (json.error) {
        return { success: false, error: json.error.message || 'Failed to create student' };
      }
    } catch (e) {
      // Try next
    }
  }

  return { success: false, error: 'Unable to connect to server.' };
}

/**
 * Toggle student active status (Deactivate / Reactivate)
 */
export async function toggleStudentStatus(studentId: string, currentlyActive: boolean): Promise<boolean> {
  const endpoint = currentlyActive ? `/admin/students/${studentId}` : `/admin/students/${studentId}/reactivate`;
  const method = currentlyActive ? 'DELETE' : 'PATCH';
  const tryUrls = [`${API_BASE_URL}${endpoint}`, `http://localhost:5001/api${endpoint}`];

  for (const targetUrl of tryUrls) {
    try {
      const res = await fetch(targetUrl, { method, credentials: 'include' });
      const json = await res.json();
      if (json.success) return true;
    } catch (e) {
      // Try next
    }
  }
  return false;
}

/**
 * Reset student password (returns one-time plaintext password in response data)
 */
export async function resetStudentPassword(
  studentId: string,
  newPassword?: string
): Promise<{ success: boolean; data?: { username: string; newPassword: string }; error?: string }> {
  const tryUrls = [
    `${API_BASE_URL}/admin/students/${studentId}/reset-password`,
    `http://localhost:5001/api/admin/students/${studentId}/reset-password`,
  ];

  for (const targetUrl of tryUrls) {
    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        return { success: true, data: json.data };
      } else if (json.error) {
        return { success: false, error: json.error.message || 'Failed to reset password' };
      }
    } catch (e) {
      // Try next
    }
  }

  return { success: false, error: 'Unable to connect to server.' };
}

/* ==========================================================================
   ADMIN MANAGEMENT API HELPERS (PHASE 11b: Content, Enquiries, Marketing)
   ========================================================================== */

export interface AdminMaterialItem {
  id: string;
  chapterId: string;
  chapterName?: string;
  subjectName?: string;
  title: string;
  type: 'pdf' | 'video' | 'note';
  fileUrl?: string;
  noteContent?: string;
  createdAt: string;
}

export interface AdminPYQItem {
  id: string;
  class: 'XI' | 'XII';
  examType: 'JEE' | 'NEET';
  subjectId: string;
  subjectName?: string;
  year: number;
  title: string;
  fileUrl: string;
  solutionUrl?: string;
  createdAt: string;
}

export interface AdminNoticeItem {
  id: string;
  title: string;
  body: string;
  scope: 'global' | 'batch';
  batchIds?: string[];
  createdAt: string;
}

export interface AdminEnquiryItem {
  id: string;
  name: string;
  phone: string;
  classInterested: 'XI' | 'XII';
  streamInterested: 'JEE' | 'NEET' | 'Foundation';
  message?: string;
  status: 'new' | 'contacted' | 'enrolled' | 'closed';
  createdAt: string;
}

export interface AdminTestimonialItem {
  id: string;
  studentName: string;
  resultText: string;
  quote: string;
  photoUrl?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface AdminCourseItem {
  id: string;
  name: string;
  class: 'XI' | 'XII';
  stream: 'JEE' | 'NEET' | 'Foundation';
  fee: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * Fetch subjects with nested chapters (for materials & pyqs management)
 */
export async function getAdminSubjects(): Promise<any[]> {
  const tryUrls = [`${API_BASE_URL}/subjects`, 'http://localhost:5001/api/subjects'];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data?.subjects) {
        return json.data.subjects;
      }
    } catch (e) {}
  }
  return [];
}

export interface AdminChapterItem {
  id: string;
  subjectId: string;
  class: 'XI' | 'XII';
  name: string;
  order: number;
}

export async function getAdminChaptersList(subjectId?: string, classLevel?: string): Promise<AdminChapterItem[]> {
  let query = '';
  const params: string[] = [];
  if (subjectId) params.push(`subjectId=${encodeURIComponent(subjectId)}`);
  if (classLevel) params.push(`class=${encodeURIComponent(classLevel)}`);
  if (params.length > 0) query = `?${params.join('&')}`;

  const tryUrls = [`${API_BASE_URL}/chapters${query}`, `http://localhost:5001/api/chapters${query}`];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data?.chapters) {
        return json.data.chapters;
      }
    } catch (e) {}
  }
  return [];
}

export async function createAdminChapter(payload: {
  subjectId: string;
  class: 'XI' | 'XII';
  name: string;
  order?: number;
}): Promise<{ success: boolean; data?: AdminChapterItem; error?: string }> {
  const tryUrls = [`${API_BASE_URL}/admin/chapters`, 'http://localhost:5001/api/admin/chapters'];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success && json.data) return { success: true, data: json.data };
      if (json.error) return { success: false, error: json.error.message };
    } catch (e) {}
  }
  return { success: false, error: 'Network error.' };
}

export async function deleteAdminChapter(id: string): Promise<boolean> {
  const tryUrls = [`${API_BASE_URL}/admin/chapters/${id}`, `http://localhost:5001/api/admin/chapters/${id}`];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (json.success) return true;
    } catch (e) {}
  }
  return false;
}

/* --- Materials --- */
export async function getAdminMaterialsList(): Promise<AdminMaterialItem[]> {
  const tryUrls = [`${API_BASE_URL}/materials`, 'http://localhost:5001/api/materials'];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data?.materials) {
        return json.data.materials;
      }
    } catch (e) {}
  }
  return [];
}

export async function createAdminMaterial(payload: {
  chapterId: string;
  title: string;
  type: 'pdf' | 'video' | 'note';
  fileUrl?: string;
  noteContent?: string;
}): Promise<{ success: boolean; data?: AdminMaterialItem; error?: string }> {
  const tryUrls = [`${API_BASE_URL}/admin/materials`, 'http://localhost:5001/api/admin/materials'];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success && json.data) return { success: true, data: json.data };
      if (json.error) return { success: false, error: json.error.message };
    } catch (e) {}
  }
  return { success: false, error: 'Network error.' };
}

export async function deleteAdminMaterial(id: string): Promise<boolean> {
  const tryUrls = [`${API_BASE_URL}/admin/materials/${id}`, `http://localhost:5001/api/admin/materials/${id}`];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (json.success) return true;
    } catch (e) {}
  }
  return false;
}

/* --- PYQs --- */
export async function getAdminPYQsList(): Promise<AdminPYQItem[]> {
  const tryUrls = [`${API_BASE_URL}/pyqs`, 'http://localhost:5001/api/pyqs'];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data?.pyqs) {
        return json.data.pyqs;
      }
    } catch (e) {}
  }
  return [];
}

export async function createAdminPYQ(payload: {
  class: 'XI' | 'XII';
  examType: 'JEE' | 'NEET';
  subjectId: string;
  year: number;
  title: string;
  fileUrl: string;
  solutionUrl?: string;
}): Promise<{ success: boolean; data?: AdminPYQItem; error?: string }> {
  const tryUrls = [`${API_BASE_URL}/admin/pyqs`, 'http://localhost:5001/api/admin/pyqs'];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success && json.data) return { success: true, data: json.data };
      if (json.error) return { success: false, error: json.error.message };
    } catch (e) {}
  }
  return { success: false, error: 'Network error.' };
}

export async function deleteAdminPYQ(id: string): Promise<boolean> {
  const tryUrls = [`${API_BASE_URL}/admin/pyqs/${id}`, `http://localhost:5001/api/admin/pyqs/${id}`];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (json.success) return true;
    } catch (e) {}
  }
  return false;
}

/* --- Notices --- */
export async function getAdminNoticesList(): Promise<AdminNoticeItem[]> {
  const tryUrls = [`${API_BASE_URL}/notices`, 'http://localhost:5001/api/notices'];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data?.notices) {
        return json.data.notices;
      }
    } catch (e) {}
  }
  return [];
}

export async function createAdminNotice(payload: {
  title: string;
  body: string;
  scope: 'global' | 'batch';
  batchIds?: string[];
}): Promise<{ success: boolean; data?: AdminNoticeItem; error?: string }> {
  const tryUrls = [`${API_BASE_URL}/admin/notices`, 'http://localhost:5001/api/admin/notices'];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success && json.data) return { success: true, data: json.data };
      if (json.error) return { success: false, error: json.error.message };
    } catch (e) {}
  }
  return { success: false, error: 'Network error.' };
}

export async function deleteAdminNotice(id: string): Promise<boolean> {
  const tryUrls = [`${API_BASE_URL}/admin/notices/${id}`, `http://localhost:5001/api/admin/notices/${id}`];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (json.success) return true;
    } catch (e) {}
  }
  return false;
}

/* --- Enquiries CRM --- */
export async function getAdminEnquiriesList(): Promise<AdminEnquiryItem[]> {
  const tryUrls = [`${API_BASE_URL}/admin/enquiries`, 'http://localhost:5001/api/admin/enquiries'];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data?.enquiries) {
        return json.data.enquiries;
      }
    } catch (e) {}
  }
  return [];
}

export async function updateAdminEnquiryStatus(
  id: string,
  status: 'new' | 'contacted' | 'enrolled' | 'closed'
): Promise<boolean> {
  const tryUrls = [`${API_BASE_URL}/admin/enquiries/${id}`, `http://localhost:5001/api/admin/enquiries/${id}`];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) return true;
    } catch (e) {}
  }
  return false;
}

/* --- Marketing: Testimonials & Courses --- */
export async function getAdminTestimonialsList(): Promise<AdminTestimonialItem[]> {
  const tryUrls = [`${API_BASE_URL}/admin/testimonials`, 'http://localhost:5001/api/admin/testimonials'];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data?.testimonials) {
        return json.data.testimonials;
      }
    } catch (e) {}
  }
  return [];
}

export async function createAdminTestimonial(payload: {
  studentName: string;
  resultText: string;
  quote: string;
  photoUrl?: string;
  isPublished?: boolean;
}): Promise<{ success: boolean; data?: AdminTestimonialItem; error?: string }> {
  const tryUrls = [`${API_BASE_URL}/admin/testimonials`, 'http://localhost:5001/api/admin/testimonials'];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success && json.data) return { success: true, data: json.data };
      if (json.error) return { success: false, error: json.error.message };
    } catch (e) {}
  }
  return { success: false, error: 'Network error.' };
}

export async function updateAdminTestimonial(
  id: string,
  payload: Partial<{ studentName: string; resultText: string; quote: string; photoUrl: string; isPublished: boolean }>
): Promise<boolean> {
  const tryUrls = [`${API_BASE_URL}/admin/testimonials/${id}`, `http://localhost:5001/api/admin/testimonials/${id}`];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) return true;
    } catch (e) {}
  }
  return false;
}

export async function deleteAdminTestimonial(id: string): Promise<boolean> {
  const tryUrls = [`${API_BASE_URL}/admin/testimonials/${id}`, `http://localhost:5001/api/admin/testimonials/${id}`];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (json.success) return true;
    } catch (e) {}
  }
  return false;
}

export async function getAdminCoursesList(): Promise<AdminCourseItem[]> {
  const tryUrls = [`${API_BASE_URL}/admin/courses`, 'http://localhost:5001/api/admin/courses'];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data?.courses) {
        return json.data.courses;
      }
    } catch (e) {}
  }
  return [];
}

export async function createAdminCourse(payload: {
  name: string;
  class: 'XI' | 'XII';
  stream: 'JEE' | 'NEET' | 'Foundation';
  fee: number;
  description?: string;
  isActive?: boolean;
}): Promise<{ success: boolean; data?: AdminCourseItem; error?: string }> {
  const tryUrls = [`${API_BASE_URL}/admin/courses`, 'http://localhost:5001/api/admin/courses'];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success && json.data) return { success: true, data: json.data };
      if (json.error) return { success: false, error: json.error.message };
    } catch (e) {}
  }
  return { success: false, error: 'Network error.' };
}

export async function updateAdminCourse(
  id: string,
  payload: Partial<{ name: string; class: 'XI' | 'XII'; stream: 'JEE' | 'NEET' | 'Foundation'; fee: number; description: string; isActive: boolean }>
): Promise<boolean> {
  const tryUrls = [`${API_BASE_URL}/admin/courses/${id}`, `http://localhost:5001/api/admin/courses/${id}`];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) return true;
    } catch (e) {}
  }
  return false;
}

export async function deleteAdminCourse(id: string): Promise<boolean> {
  const tryUrls = [`${API_BASE_URL}/admin/courses/${id}`, `http://localhost:5001/api/admin/courses/${id}`];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (json.success) return true;
    } catch (e) {}
  }
  return false;
}



