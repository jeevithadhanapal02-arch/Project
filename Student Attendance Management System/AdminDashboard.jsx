import { useState, useMemo } from "react";
import { getAllAttendance, getStudents, updateAttendance, deleteAttendance, getAttendanceStats, ELIGIBILITY_THRESHOLD } from "../db";
import BackendCodeViewer from "./BackendCodeViewer";

export default function AdminDashboard({ user }) {
  const [tab, setTab] = useState("records");
  const [editId, setEditId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [refresh, setRefresh] = useState(0);

  const records = useMemo(() => getAllAttendance(), [refresh]);
  const students = useMemo(() => getStudents(), []);

  function startEdit(rec) {
    setEditId(rec.id);
    setEditFields({ status: rec.status, date: rec.date, subject: rec.subject });
  }

  function cancelEdit() { setEditId(null); setEditFields({}); }

  function saveEdit(id) {
    updateAttendance(id, editFields);
    setEditId(null);
    setRefresh((r) => r + 1);
  }

  function handleDelete(id) {
    if (!window.confirm("Delete this attendance record?")) return;
    deleteAttendance(id);
    setRefresh((r) => r + 1);
  }

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">Admin Panel</h2>
          <p className="dash-sub">{user.name}</p>
        </div>
      </div>

      <div className="tab-row">
        <button className={`tab-btn${tab === "records" ? " active-tab" : ""}`} onClick={() => setTab("records")}>All Records</button>
        <button className={`tab-btn${tab === "summary" ? " active-tab" : ""}`} onClick={() => setTab("summary")}>Student Summary</button>
        <button className={`tab-btn${tab === "backend" ? " active-tab" : ""}`} onClick={() => setTab("backend")}>Backend Code</button>
      </div>

      {tab === "records" && (
        <div className="table-section">
          <h3 className="section-title">Attendance Records &mdash; Edit / Delete</h3>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, i) => (
                  <tr key={rec.id} className={editId === rec.id ? "editing-row" : ""}>
                    <td className="muted-cell">{i + 1}</td>
                    <td>
                      {editId === rec.id
                        ? <input type="date" value={editFields.date} onChange={(e) => setEditFields((f) => ({ ...f, date: e.target.value }))} className="edit-input" />
                        : formatDate(rec.date)}
                    </td>
                    <td>{rec.studentName}</td>
                    <td className="muted-cell">{rec.rollNo}</td>
                    <td>
                      {editId === rec.id
                        ? <input type="text" value={editFields.subject} onChange={(e) => setEditFields((f) => ({ ...f, subject: e.target.value }))} className="edit-input" />
                        : rec.subject}
                    </td>
                    <td>
                      {editId === rec.id
                        ? (
                          <select value={editFields.status} onChange={(e) => setEditFields((f) => ({ ...f, status: e.target.value }))} className="edit-select">
                            <option value="present">present</option>
                            <option value="absent">absent</option>
                          </select>
                        )
                        : <span className={`status-pill ${rec.status}`}>{rec.status}</span>}
                    </td>
                    <td>
                      {editId === rec.id ? (
                        <div className="action-btns">
                          <button className="btn-save-sm" onClick={() => saveEdit(rec.id)}>Save</button>
                          <button className="btn-cancel-sm" onClick={cancelEdit}>Cancel</button>
                        </div>
                      ) : (
                        <div className="action-btns">
                          <button className="btn-edit-sm" onClick={() => startEdit(rec)}>Edit</button>
                          <button className="btn-del-sm" onClick={() => handleDelete(rec.id)}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "backend" && <BackendCodeViewer />}

      {tab === "summary" && (
        <div className="table-section">
          <h3 className="section-title">Student Eligibility Summary</h3>
          <div className="table-container">
            <table className="att-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Total</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Percentage</th>
                  <th>Exam Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const st = getAttendanceStats(s.id);
                  const eligible = st.percentage >= ELIGIBILITY_THRESHOLD;
                  return (
                    <tr key={s.id}>
                      <td className="muted-cell">{s.rollNo}</td>
                      <td>{s.name}</td>
                      <td>{st.total}</td>
                      <td className="txt-green">{st.present}</td>
                      <td className="txt-red">{st.absent}</td>
                      <td>
                        <div className="pct-bar-wrap">
                          <div className="pct-bar-bg">
                            <div className={`pct-bar-fill ${eligible ? "fill-green" : "fill-red"}`} style={{ width: `${st.percentage}%` }} />
                          </div>
                          <span className="pct-label">{st.percentage}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`eligibility-badge ${eligible ? "eligible" : "ineligible"}`} style={{ fontSize: "0.75rem", padding: "3px 10px" }}>
                          {eligible ? "Eligible" : "Not Eligible"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="eligibility-msg" style={{ marginTop: "1rem" }}>
            Minimum attendance required for exam eligibility: <strong>{ELIGIBILITY_THRESHOLD}%</strong>
          </p>
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
