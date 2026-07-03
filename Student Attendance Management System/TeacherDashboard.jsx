import { useState, useMemo } from "react";
import { getStudents, markAttendance, getAllAttendance } from "../db";

const today = new Date().toISOString().split("T")[0];

export default function TeacherDashboard({ user }) {
  const [date, setDate] = useState(today);
  const [subject] = useState(user.subject);
  const [attendance, setAttendance] = useState({});
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("mark");

  const students = useMemo(() => getStudents(), []);
  const allRecords = useMemo(() => getAllAttendance(), [saved]);

  function toggleStatus(studentId) {
    setAttendance((prev) => {
      const current = prev[studentId] || "present";
      return { ...prev, [studentId]: current === "present" ? "absent" : "present" };
    });
    setSaved(false);
  }

  function handleSave() {
    students.forEach((s) => {
      const status = attendance[s.id] || "present";
      markAttendance(s.id, date, status, subject, user.name);
    });
    setSaved(true);
  }

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">Teacher Panel</h2>
          <p className="dash-sub">{user.name} &mdash; {user.subject}</p>
        </div>
      </div>

      <div className="tab-row">
        <button className={`tab-btn${tab === "mark" ? " active-tab" : ""}`} onClick={() => setTab("mark")}>Mark Attendance</button>
        <button className={`tab-btn${tab === "view" ? " active-tab" : ""}`} onClick={() => setTab("view")}>View All Records</button>
      </div>

      {tab === "mark" && (
        <div className="mark-section">
          <div className="mark-controls">
            <div className="form-group inline-group">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSaved(false); }} max={today} />
            </div>
            <div className="form-group inline-group">
              <label>Subject</label>
              <input type="text" value={subject} readOnly />
            </div>
          </div>

          <div className="table-container">
            <table className="att-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Status</th>
                  <th>Toggle</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const status = attendance[s.id] || "present";
                  return (
                    <tr key={s.id}>
                      <td className="muted-cell">{s.rollNo}</td>
                      <td>{s.name}</td>
                      <td>
                        <span className={`status-pill ${status}`}>{status}</span>
                      </td>
                      <td>
                        <button
                          className={`toggle-btn ${status === "present" ? "tog-present" : "tog-absent"}`}
                          onClick={() => toggleStatus(s.id)}
                        >
                          {status === "present" ? "Mark Absent" : "Mark Present"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="save-row">
            {saved && <span className="saved-msg">Attendance saved successfully!</span>}
            <button className="btn-primary" onClick={handleSave}>Save Attendance</button>
          </div>
        </div>
      )}

      {tab === "view" && (
        <div className="table-section">
          <h3 className="section-title">All Attendance Records</h3>
          <div className="table-container">
            <table className="att-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Subject</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allRecords.map((rec, i) => (
                  <tr key={rec.id}>
                    <td className="muted-cell">{i + 1}</td>
                    <td>{formatDate(rec.date)}</td>
                    <td>{rec.studentName}</td>
                    <td className="muted-cell">{rec.rollNo}</td>
                    <td>{rec.subject}</td>
                    <td><span className={`status-pill ${rec.status}`}>{rec.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
