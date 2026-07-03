import { useMemo, useState } from "react";
import { getAttendanceForStudent, getAttendanceStats, ELIGIBILITY_THRESHOLD } from "../db";

export default function StudentDashboard({ user }) {
  const [filterSubject, setFilterSubject] = useState("All");
  const records = useMemo(() => getAttendanceForStudent(user.id), [user.id]);
  const stats = useMemo(() => getAttendanceStats(user.id), [user.id]);

  const subjects = useMemo(() => {
    const s = new Set(records.map((r) => r.subject));
    return ["All", ...Array.from(s)];
  }, [records]);

  const filtered = filterSubject === "All"
    ? records
    : records.filter((r) => r.subject === filterSubject);

  const eligible = stats.percentage >= ELIGIBILITY_THRESHOLD;

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">My Attendance</h2>
          <p className="dash-sub">{user.rollNo} &mdash; {user.course}</p>
        </div>
        <div className={`eligibility-badge ${eligible ? "eligible" : "ineligible"}`}>
          {eligible ? "Exam Eligible" : "Not Eligible"}
          <span className="eligibility-pct">{stats.percentage}%</span>
        </div>
      </div>

      <div className="stats-row">
        <StatCard label="Total Classes" value={stats.total} color="var(--surface-2)" />
        <StatCard label="Present" value={stats.present} color="var(--green-soft)" />
        <StatCard label="Absent" value={stats.absent} color="var(--red-soft)" />
        <StatCard label="Attendance %" value={`${stats.percentage}%`} color="var(--blue-soft)" />
      </div>

      <div className="progress-wrap">
        <div className="progress-labels">
          <span>Attendance Progress</span>
          <span className={eligible ? "txt-green" : "txt-red"}>{stats.percentage}% / {ELIGIBILITY_THRESHOLD}% required</span>
        </div>
        <div className="progress-bar-bg">
          <div
            className={`progress-bar-fill ${eligible ? "fill-green" : "fill-red"}`}
            style={{ width: `${Math.min(stats.percentage, 100)}%` }}
          />
          <div className="progress-threshold" style={{ left: `${ELIGIBILITY_THRESHOLD}%` }} />
        </div>
        <p className="eligibility-msg">
          {eligible
            ? `You meet the ${ELIGIBILITY_THRESHOLD}% attendance requirement and are eligible to appear in exams.`
            : `You need at least ${ELIGIBILITY_THRESHOLD}% attendance to appear in exams. Current: ${stats.percentage}%. You need ${Math.max(0, Math.ceil(((ELIGIBILITY_THRESHOLD / 100) * (stats.total + 10) - stats.present)))} more present classes (approx).`}
        </p>
      </div>

      <div className="table-section">
        <div className="table-toolbar">
          <h3 className="section-title">Attendance Records</h3>
          <div className="filter-wrap">
            <label>Subject:</label>
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
              {subjects.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="att-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Marked By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="empty-cell">No records found.</td></tr>
              ) : (
                filtered.map((rec, i) => (
                  <tr key={rec.id}>
                    <td className="muted-cell">{i + 1}</td>
                    <td>{formatDate(rec.date)}</td>
                    <td>{rec.subject}</td>
                    <td>
                      <span className={`status-pill ${rec.status}`}>{rec.status}</span>
                    </td>
                    <td className="muted-cell">{rec.markedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card" style={{ background: color }}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function formatDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
