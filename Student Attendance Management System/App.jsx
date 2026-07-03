import { useState } from "react";
import "./App.css";
import LoginPage from "./components/LoginPage";
import Navbar from "./components/Navbar";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [user, setUser] = useState(null);

  function handleLogin(userData) {
    setUser(userData);
  }

  function handleLogout() {
    setUser(null);
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="app-main">
        {user.role === "student" && <StudentDashboard user={user} />}
        {user.role === "teacher" && <TeacherDashboard user={user} />}
        {user.role === "admin"   && <AdminDashboard user={user} />}
      </main>
    </div>
  );
}
