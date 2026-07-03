export default function Navbar({ user, onLogout }) {
  const roleColors = {
    student: "var(--accent-student)",
    teacher: "var(--accent-teacher)",
    admin:   "var(--accent-admin)",
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">A</span>
        <span className="navbar-title">AttendTrack</span>
      </div>
      <div className="navbar-right">
        <div className="navbar-user">
          <div className="navbar-avatar" style={{ background: roleColors[user.role] }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="navbar-info">
            <span className="navbar-name">{user.name}</span>
            <span className="navbar-role" style={{ color: roleColors[user.role] }}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
        </div>
        <button className="btn-logout" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}
