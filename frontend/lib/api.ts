const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

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
    return [];
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
    return [];
  }
}

export interface FacultyItem {
  id: string;
  name: string;
  role: string;
  subject: 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics';
  qualification: string;
  specialization?: string;
  bio: string;
  photoUrl?: string | null;
  isPublished?: boolean;
  order?: number;
  createdAt?: string;
}

/**
 * Fetch published faculty members from backend
 */
export async function getPublicFaculty(): Promise<FacultyItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/faculty`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.success ? json.data.faculty : [];
  } catch (error) {
    console.error('[API Error] Fetch faculty failed:', error);
    return [];
  }
}

/**
 * Submit public student enquiry
 */
export async function submitEnquiry(
  payload: EnquiryPayload
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

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
  batch?: {
    id: string;
    name: string;
    class: string;
    stream: 'JEE' | 'NEET' | 'Foundation';
    timingLabel?: string;
  } | null;
}

/**
 * Login user via POST /api/auth/login
 * Browser automatically stores the HttpOnly JWT cookie returned in Set-Cookie header.
 */
export async function loginUser(
  username: string,
  password: string
): Promise<{ success: boolean; data?: UserSession; error?: { code: string; message: string } }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    const json = await res.json();
    if (json.success) {
      return { success: true, data: json.data.user };
    } else {
      return {
        success: false,
        error: {
          code: json.error?.code || 'LOGIN_FAILED',
          message: json.error?.message || 'Invalid username or password',
        },
      };
    }
  } catch (err) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Unable to connect to authentication server' },
    };
  }
}

/**
 * Logout user via POST /api/auth/logout
 * Clears HttpOnly session cookie.
 */
export async function logoutUser(): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    const json = await res.json();
    if (json.success) return { success: true };
  } catch (err) {
    // Network error
  }
  return { success: false };
}

/**
 * Fetch current authenticated user via GET /api/auth/me
 */
export async function getMe(): Promise<{ success: boolean; user?: UserSession }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
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
    // Network error
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
  try {
    const res = await fetch(`${API_BASE_URL}/tests`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data.tests || [];
    }
  } catch (e) {
    console.error('[API Error] Fetch student tests failed:', e);
  }
  return [];
}

/**
 * Fetch questions for test attempt
 */
export async function getTestAttempt(
  testId: string
): Promise<{ success: boolean; data?: TestAttemptPayload; error?: { code: string; message: string } }> {
  try {
    const res = await fetch(`${API_BASE_URL}/tests/${testId}/attempt`, { method: 'GET', credentials: 'include' });
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
    console.error('[API Error] Fetch test attempt failed:', e);
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
  try {
    const res = await fetch(`${API_BASE_URL}/tests/${testId}/submit`, {
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
    console.error('[API Error] Submit test attempt failed:', e);
  }

  return { success: false, error: { code: 'NETWORK_ERROR', message: 'Unable to connect to server.' } };
}

/**
 * Fetch test result for student
 */
export async function getTestResult(
  testId: string
): Promise<{ success: boolean; data?: TestResultPayload; error?: { code: string; message: string } }> {
  try {
    const res = await fetch(`${API_BASE_URL}/tests/${testId}/result`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data) {
      return { success: true, data: json.data };
    }
  } catch (e) {
    console.error('[API Error] Fetch test result failed:', e);
  }

  return { success: false, error: { code: 'NOT_FOUND', message: 'Result not found.' } };
}

/**
 * Fetch test rankings leaderboard
 */
export async function getTestRankings(
  testId: string
): Promise<{ success: boolean; data?: TestRankingsPayload; error?: { code: string; message: string } }> {
  try {
    const res = await fetch(`${API_BASE_URL}/tests/${testId}/rankings`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data) {
      return { success: true, data: json.data };
    }
  } catch (e) {
    console.error('[API Error] Fetch test rankings failed:', e);
  }

  return { success: false, error: { code: 'NOT_FOUND', message: 'Rankings not found.' } };
}

/**
 * Fetch student study materials (scoped to student class/stream)
 */
export async function getStudentMaterials(): Promise<MaterialItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/materials`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data.materials || [];
    }
  } catch (e) {
    console.error('[API Error] Fetch student materials failed:', e);
  }
  return [];
}

/**
 * Fetch student PYQs (scoped to student class)
 */
export async function getStudentPYQs(): Promise<PYQItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/pyqs`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data.pyqs || [];
    }
  } catch (e) {
    console.error('[API Error] Fetch student PYQs failed:', e);
  }
  return [];
}

/**
 * Fetch student notices (scoped to global OR student's batchId)
 */
export async function getStudentNotices(): Promise<NoticeItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/notices`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data.notices || [];
    }
  } catch (e) {
    console.error('[API Error] Fetch student notices failed:', e);
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
  try {
    const res = await fetch(`${API_BASE_URL}/chatbot/message`, {
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
    console.error('[API Error] Send chat message failed:', e);
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
  try {
    const res = await fetch(`${API_BASE_URL}/admin/batches?includeArchived=${includeArchived}`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data?.batches) {
      return json.data.batches;
    }
  } catch (e) {
    console.error('[API Error] Fetch admin batches failed:', e);
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
  try {
    const res = await fetch(`${API_BASE_URL}/admin/batches`, {
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
    console.error('[API Error] Create admin batch failed:', e);
  }

  return { success: false, error: 'Unable to connect to server.' };
}

/**
 * Toggle batch active status (Archive / Reactivate)
 */
export async function toggleBatchStatus(batchId: string, currentlyActive: boolean): Promise<boolean> {
  const endpoint = currentlyActive ? `/admin/batches/${batchId}` : `/admin/batches/${batchId}/reactivate`;
  const method = currentlyActive ? 'DELETE' : 'PATCH';

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { method, credentials: 'include' });
    const json = await res.json();
    if (json.success) return true;
  } catch (e) {
    console.error('[API Error] Toggle batch status failed:', e);
  }
  return false;
}

/**
 * Permanently delete a batch record
 */
export async function deleteAdminBatch(batchId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/batches/${batchId}`, { method: 'DELETE', credentials: 'include' });
    const json = await res.json();
    if (json.success) return { success: true };
    return { success: false, error: json.error?.message || 'Failed to delete batch' };
  } catch (e) {
    console.error('[API Error] Delete admin batch failed:', e);
    return { success: false, error: 'Network error deleting batch.' };
  }
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

  try {
    const res = await fetch(`${API_BASE_URL}/admin/students${queryStr}`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data) {
      return {
        students: json.data.students || [],
        total: json.data.total || json.data.students?.length || 0,
      };
    }
  } catch (e) {
    console.error('[API Error] Fetch admin students failed:', e);
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
  try {
    const res = await fetch(`${API_BASE_URL}/admin/students`, {
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
    console.error('[API Error] Create admin student failed:', e);
  }

  return { success: false, error: 'Unable to connect to server.' };
}

/**
 * Toggle student active status (Deactivate / Reactivate)
 */
export async function toggleStudentStatus(studentId: string, currentlyActive: boolean): Promise<boolean> {
  const endpoint = currentlyActive ? `/admin/students/${studentId}/deactivate` : `/admin/students/${studentId}/reactivate`;

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'PATCH', credentials: 'include' });
    const json = await res.json();
    if (json.success) return true;
  } catch (e) {
    console.error('[API Error] Toggle student status failed:', e);
  }
  return false;
}

/**
 * Permanently delete student record
 */
export async function deleteAdminStudent(studentId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/students/${studentId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const json = await res.json();
    if (json.success) return true;
  } catch (e) {
    console.error('[API Error] Delete admin student failed:', e);
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
  try {
    const res = await fetch(`${API_BASE_URL}/admin/students/${studentId}/reset-password`, {
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
    console.error('[API Error] Reset student password failed:', e);
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
  try {
    const res = await fetch(`${API_BASE_URL}/subjects`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data?.subjects) {
      return json.data.subjects;
    }
  } catch (e) {
    console.error('[API Error] Fetch admin subjects failed:', e);
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

  try {
    const res = await fetch(`${API_BASE_URL}/chapters${query}`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data?.chapters) {
      return json.data.chapters;
    }
  } catch (e) {
    console.error('[API Error] Fetch admin chapters failed:', e);
  }
  return [];
}

export async function createAdminChapter(payload: {
  subjectId: string;
  class: 'XI' | 'XII';
  name: string;
  order?: number;
}): Promise<{ success: boolean; data?: AdminChapterItem; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success && json.data) return { success: true, data: json.data };
    if (json.error) return { success: false, error: json.error.message };
  } catch (e) {
    console.error('[API Error] Create admin chapter failed:', e);
  }
  return { success: false, error: 'Network error.' };
}

export async function deleteAdminChapter(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/chapters/${id}`, { method: 'DELETE', credentials: 'include' });
    const json = await res.json();
    if (json.success) return true;
  } catch (e) {
    console.error('[API Error] Delete admin chapter failed:', e);
  }
  return false;
}

/* --- Materials --- */
export async function getAdminMaterialsList(): Promise<AdminMaterialItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/materials`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data?.materials) {
      return json.data.materials;
    }
  } catch (e) {
    console.error('[API Error] Fetch admin materials failed:', e);
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
  try {
    const res = await fetch(`${API_BASE_URL}/admin/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success && json.data) return { success: true, data: json.data };
    if (json.error) return { success: false, error: json.error.message };
  } catch (e) {
    console.error('[API Error] Create admin material failed:', e);
  }
  return { success: false, error: 'Network error.' };
}

export async function deleteAdminMaterial(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/materials/${id}`, { method: 'DELETE', credentials: 'include' });
    const json = await res.json();
    if (json.success) return true;
  } catch (e) {
    console.error('[API Error] Delete admin material failed:', e);
  }
  return false;
}

/* --- PYQs --- */
export async function getAdminPYQsList(): Promise<AdminPYQItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/pyqs`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data?.pyqs) {
      return json.data.pyqs;
    }
  } catch (e) {
    console.error('[API Error] Fetch admin PYQs failed:', e);
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
  try {
    const res = await fetch(`${API_BASE_URL}/admin/pyqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success && json.data) return { success: true, data: json.data };
    if (json.error) return { success: false, error: json.error.message };
  } catch (e) {
    console.error('[API Error] Create admin PYQ failed:', e);
  }
  return { success: false, error: 'Network error.' };
}

export async function deleteAdminPYQ(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/pyqs/${id}`, { method: 'DELETE', credentials: 'include' });
    const json = await res.json();
    if (json.success) return true;
  } catch (e) {
    console.error('[API Error] Delete admin PYQ failed:', e);
  }
  return false;
}

/* --- Notices --- */
export async function getAdminNoticesList(): Promise<AdminNoticeItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/notices`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data?.notices) {
      return json.data.notices;
    }
  } catch (e) {
    console.error('[API Error] Fetch admin notices failed:', e);
  }
  return [];
}

export async function createAdminNotice(payload: {
  title: string;
  body: string;
  scope: 'global' | 'batch';
  batchIds?: string[];
}): Promise<{ success: boolean; data?: AdminNoticeItem; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/notices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success && json.data) return { success: true, data: json.data };
    if (json.error) return { success: false, error: json.error.message };
  } catch (e) {
    console.error('[API Error] Create admin notice failed:', e);
  }
  return { success: false, error: 'Network error.' };
}

export async function deleteAdminNotice(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/notices/${id}`, { method: 'DELETE', credentials: 'include' });
    const json = await res.json();
    if (json.success) return true;
  } catch (e) {
    console.error('[API Error] Delete admin notice failed:', e);
  }
  return false;
}

/* --- Enquiries CRM --- */
export async function getAdminEnquiriesList(): Promise<AdminEnquiryItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/enquiries`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data?.enquiries) {
      return json.data.enquiries;
    }
  } catch (e) {
    console.error('[API Error] Fetch admin enquiries failed:', e);
  }
  return [];
}

export async function updateAdminEnquiryStatus(
  id: string,
  status: 'new' | 'contacted' | 'enrolled' | 'closed'
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/enquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.success) return true;
  } catch (e) {
    console.error('[API Error] Update admin enquiry status failed:', e);
  }
  return false;
}

export async function deleteAdminEnquiry(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/enquiries/${id}`, { method: 'DELETE', credentials: 'include' });
    const json = await res.json();
    if (json.success) return true;
  } catch (e) {
    console.error('[API Error] Delete admin enquiry failed:', e);
  }
  return false;
}

/* --- Marketing: Testimonials & Courses --- */
export async function getAdminTestimonialsList(): Promise<AdminTestimonialItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/testimonials`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data?.testimonials) {
      return json.data.testimonials;
    }
  } catch (e) {
    console.error('[API Error] Fetch admin testimonials failed:', e);
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
  try {
    const res = await fetch(`${API_BASE_URL}/admin/testimonials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success && json.data) return { success: true, data: json.data };
    if (json.error) return { success: false, error: json.error.message };
  } catch (e) {
    console.error('[API Error] Create admin testimonial failed:', e);
  }
  return { success: false, error: 'Network error.' };
}

export async function updateAdminTestimonial(
  id: string,
  payload: Partial<{ studentName: string; resultText: string; quote: string; photoUrl: string; isPublished: boolean }>
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/testimonials/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) return true;
  } catch (e) {
    console.error('[API Error] Update admin testimonial failed:', e);
  }
  return false;
}

export async function deleteAdminTestimonial(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/testimonials/${id}`, { method: 'DELETE', credentials: 'include' });
    const json = await res.json();
    if (json.success) return true;
  } catch (e) {
    console.error('[API Error] Delete admin testimonial failed:', e);
  }
  return false;
}

export async function getAdminCoursesList(): Promise<AdminCourseItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/courses`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data?.courses) {
      return json.data.courses;
    }
  } catch (e) {
    console.error('[API Error] Fetch admin courses failed:', e);
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
  try {
    const res = await fetch(`${API_BASE_URL}/admin/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success && json.data) return { success: true, data: json.data };
    if (json.error) return { success: false, error: json.error.message };
  } catch (e) {
    console.error('[API Error] Create admin course failed:', e);
  }
  return { success: false, error: 'Network error.' };
}

export async function updateAdminCourse(
  id: string,
  payload: Partial<{ name: string; class: 'XI' | 'XII'; stream: 'JEE' | 'NEET' | 'Foundation'; fee: number; description: string; isActive: boolean }>
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/courses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) return true;
  } catch (e) {
    console.error('[API Error] Update admin course failed:', e);
  }
  return false;
}

export async function deleteAdminCourse(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/courses/${id}`, { method: 'DELETE', credentials: 'include' });
    const json = await res.json();
    if (json.success) return true;
  } catch (e) {
    console.error('[API Error] Delete admin course failed:', e);
  }
  return false;
}

/* --- Faculty Management --- */
export async function getAdminFacultyList(): Promise<FacultyItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/faculty`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data?.faculty) {
      return json.data.faculty;
    }
  } catch (e) {
    console.error('[API Error] Fetch admin faculty failed:', e);
  }
  return [];
}

export async function createAdminFaculty(payload: {
  name: string;
  role: string;
  subject: 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics';
  qualification: string;
  specialization?: string;
  bio: string;
  photoUrl?: string;
  isPublished?: boolean;
  order?: number;
}): Promise<{ success: boolean; data?: FacultyItem; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/faculty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success && json.data) return { success: true, data: json.data };
    if (json.error) return { success: false, error: json.error.message };
  } catch (e) {
    console.error('[API Error] Create admin faculty failed:', e);
  }
  return { success: false, error: 'Network error.' };
}

export async function updateAdminFaculty(
  id: string,
  payload: Partial<{
    name: string;
    role: string;
    subject: 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics';
    qualification: string;
    specialization: string;
    bio: string;
    photoUrl: string;
    isPublished: boolean;
    order: number;
  }>
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/faculty/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) return true;
  } catch (e) {
    console.error('[API Error] Update admin faculty failed:', e);
  }
  return false;
}

export async function deleteAdminFaculty(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/faculty/${id}`, { method: 'DELETE', credentials: 'include' });
    const json = await res.json();
    if (json.success) return true;
  } catch (e) {
    console.error('[API Error] Delete admin faculty failed:', e);
  }
  return false;
}

/* ==========================================================================
   ADMIN TEST SCHEDULER & AUTHORING API HELPERS (PHASE 11c)
   ========================================================================== */

export interface AdminTestListItem {
  id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'upcoming' | 'active' | 'completed';
  negativeMarkingRatio: number;
  batches: string[];
  questionCount: number;
  createdAt: string;
}

export interface AdminTestDetail {
  id: string;
  _id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  negativeMarkingRatio: number;
  subjectIds: { _id: string; id: string; name: string }[];
  batchIds: { _id: string; id: string; name: string; class: string; stream: string }[];
  questions: {
    id: string;
    text: string;
    options: string[];
    correctOptionIndex: number;
    marks: number;
  }[];
  createdAt?: string;
}

export async function getAdminTestsList(): Promise<AdminTestListItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/tests`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data?.tests) {
      return json.data.tests;
    }
  } catch (e) {
    console.error('[API Error] Fetch admin tests failed:', e);
  }
  return [];
}

export async function getAdminTestById(id: string): Promise<AdminTestDetail | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/tests/${id}`, { method: 'GET', credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data?.test) {
      return json.data.test;
    }
  } catch (e) {
    console.error('[API Error] Fetch admin test by id failed:', e);
  }
  return null;
}

export async function createAdminTest(payload: {
  title: string;
  subjectIds: string[];
  batchIds: string[];
  scheduledAt: string;
  durationMinutes: number;
  negativeMarkingRatio: number;
  questions: {
    id: string;
    text: string;
    options: string[];
    correctOptionIndex: number;
    marks: number;
  }[];
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success && json.data) return { success: true, data: json.data };
    if (json.error) return { success: false, error: json.error.message };
  } catch (e) {
    console.error('[API Error] Create admin test failed:', e);
  }
  return { success: false, error: 'Network error.' };
}

