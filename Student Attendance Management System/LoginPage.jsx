import { useState } from "react";
import { authenticate } from "../db";

const ROLES = [
  { key: "student", label: "Student", icon: "👤", color: "var(--accent-student)" },
  { key: "teacher", label: "Teacher", icon: "🎓", color: "var(--accent-teacher)" },
  { key: "admin",   label: "Admin",   icon: "🛡️", color: "var(--accent-admin)" },
];

const DEMO = {
  student: { username: "alice",      password: "alice123" },
  teacher: { username: "prof_kumar", password: "teach123" },
  admin:   { username: "admin",      password: "admin@123" },
};

export default function LoginPage({ onLogin }) {
  const [role, setRole] = useState("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleRoleChange(r) {
    setRole(r);
    setUsername("");
    setPassword("");
    setError("");
  }

  function fillDemo() {
    setUsername(DEMO[role].username);
    setPassword(DEMO[role].password);
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const user = authenticate(role, username.trim(), password);
      if (user) {
        onLogin({ ...user, role });
      } else {
        setError("Invalid username or password.");
      }
      setLoading(false);
    }, 400);
  }

  const activeRole = ROLES.find((r) => r.key === role);

  return (
    <div className="login-root">
      <div className="login-bg-grid" />
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <span className="login-logo-icon">A</span>
            <span className="login-logo-text">AttendTrack</span>
          </div>
          <p className="login-subtitle">Student Attendance Management System</p>
        </div>

        <div className="role-tabs">
          {ROLES.map((r) => (
            <button
              key={r.key}
              className={`role-tab${role === r.key ? " active" : ""}`}
              style={role === r.key ? { "--tab-color": r.color } : {}}
              onClick={() => handleRoleChange(r.key)}
              type="button"
            >
              <span className="role-tab-label">{r.label}</span>
            </button>
          ))}
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder={`Enter ${activeRole.label.toLowerCase()} username`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="btn-login"
            disabled={loading}
            style={{ "--btn-color": activeRole.color }}
          >
            {loading ? "Signing in..." : `Sign in as ${activeRole.label}`}
          </button>

          <button type="button" className="btn-demo" onClick={fillDemo}>
            Fill demo credentials
          </button>
        </form>

        <div className="login-hint">
          <strong>Demo accounts:</strong>&nbsp; alice / alice123 &nbsp;|&nbsp; prof_kumar / teach123 &nbsp;|&nbsp; admin / admin@123
        </div>
      </div>
    </div>
  );
}
