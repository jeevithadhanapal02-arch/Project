// ============================================================
// MOCK IN-BROWSER DATABASE (mirrors the MySQL schema below)
// In production this is replaced by API calls to the Python
// Flask backend which talks to a real MySQL database.
// ============================================================

const STUDENTS = [
  { id: 1, username: "alice", password: "alice123", name: "Alice Johnson", rollNo: "CS2024001", course: "Computer Science" },
  { id: 2, username: "bob",   password: "bob123",   name: "Bob Smith",    rollNo: "CS2024002", course: "Computer Science" },
  { id: 3, username: "carol", password: "carol123", name: "Carol Davis",  rollNo: "CS2024003", course: "Computer Science" },
];

const TEACHERS = [
  { id: 1, username: "prof_kumar",  password: "teach123", name: "Prof. Raj Kumar",   subject: "Mathematics" },
  { id: 2, username: "prof_sharma", password: "teach456", name: "Prof. Anita Sharma", subject: "Physics" },
];

const ADMINS = [
  { id: 1, username: "admin", password: "admin@123", name: "System Administrator" },
];

// Attendance table: { id, studentId, date, status, subject, markedBy }
let attendanceRecords = [
  { id: 1,  studentId: 1, date: "2026-01-06", status: "present", subject: "Mathematics", markedBy: "Prof. Raj Kumar" },
  { id: 2,  studentId: 2, date: "2026-01-06", status: "absent",  subject: "Mathematics", markedBy: "Prof. Raj Kumar" },
  { id: 3,  studentId: 3, date: "2026-01-06", status: "present", subject: "Mathematics", markedBy: "Prof. Raj Kumar" },
  { id: 4,  studentId: 1, date: "2026-01-07", status: "present", subject: "Physics",     markedBy: "Prof. Anita Sharma" },
  { id: 5,  studentId: 2, date: "2026-01-07", status: "present", subject: "Physics",     markedBy: "Prof. Anita Sharma" },
  { id: 6,  studentId: 3, date: "2026-01-07", status: "absent",  subject: "Physics",     markedBy: "Prof. Anita Sharma" },
  { id: 7,  studentId: 1, date: "2026-01-08", status: "present", subject: "Mathematics", markedBy: "Prof. Raj Kumar" },
  { id: 8,  studentId: 2, date: "2026-01-08", status: "absent",  subject: "Mathematics", markedBy: "Prof. Raj Kumar" },
  { id: 9,  studentId: 3, date: "2026-01-08", status: "present", subject: "Mathematics", markedBy: "Prof. Raj Kumar" },
  { id: 10, studentId: 1, date: "2026-01-09", status: "absent",  subject: "Physics",     markedBy: "Prof. Anita Sharma" },
  { id: 11, studentId: 2, date: "2026-01-09", status: "present", subject: "Physics",     markedBy: "Prof. Anita Sharma" },
  { id: 12, studentId: 3, date: "2026-01-09", status: "present", subject: "Physics",     markedBy: "Prof. Anita Sharma" },
  { id: 13, studentId: 1, date: "2026-01-10", status: "present", subject: "Mathematics", markedBy: "Prof. Raj Kumar" },
  { id: 14, studentId: 2, date: "2026-01-10", status: "present", subject: "Mathematics", markedBy: "Prof. Raj Kumar" },
  { id: 15, studentId: 3, date: "2026-01-10", status: "absent",  subject: "Mathematics", markedBy: "Prof. Raj Kumar" },
];

let nextId = 16;

export const ELIGIBILITY_THRESHOLD = 75; // percent

// ── Auth ────────────────────────────────────────────────────
export function authenticate(role, username, password) {
  const pool = role === "student" ? STUDENTS : role === "teacher" ? TEACHERS : ADMINS;
  return pool.find((u) => u.username === username && u.password === password) || null;
}

// ── Queries ──────────────────────────────────────────────────
export function getStudents() {
  return [...STUDENTS];
}

export function getAttendanceForStudent(studentId) {
  return attendanceRecords
    .filter((r) => r.studentId === studentId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function getAllAttendance() {
  return attendanceRecords
    .map((r) => ({
      ...r,
      studentName: STUDENTS.find((s) => s.id === r.studentId)?.name || "Unknown",
      rollNo: STUDENTS.find((s) => s.id === r.studentId)?.rollNo || "-",
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function getAttendanceStats(studentId) {
  const records = getAttendanceForStudent(studentId);
  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
  return { total, present, absent: total - present, percentage };
}

// ── Mutations ────────────────────────────────────────────────
export function markAttendance(studentId, date, status, subject, markedBy) {
  const existing = attendanceRecords.find(
    (r) => r.studentId === studentId && r.date === date && r.subject === subject
  );
  if (existing) {
    existing.status = status;
    return existing;
  }
  const rec = { id: nextId++, studentId, date, status, subject, markedBy };
  attendanceRecords.push(rec);
  return rec;
}

export function updateAttendance(id, fields) {
  const idx = attendanceRecords.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  attendanceRecords[idx] = { ...attendanceRecords[idx], ...fields };
  return attendanceRecords[idx];
}

export function deleteAttendance(id) {
  const before = attendanceRecords.length;
  attendanceRecords = attendanceRecords.filter((r) => r.id !== id);
  return attendanceRecords.length < before;
}
