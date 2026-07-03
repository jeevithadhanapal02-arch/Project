/**
 * ============================================================
 *  AttendTrack – Python Flask + MySQL Backend Reference
 *  Copy these code blocks into your local project files.
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
//  1.  MySQL Schema  (schema.sql)
// ─────────────────────────────────────────────────────────────
export const MYSQL_SCHEMA = `
-- Run this file once to set up the database:
--   mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS attendtrack;
USE attendtrack;

-- ── Students ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(60)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(120) NOT NULL,
  roll_no       VARCHAR(30)  NOT NULL UNIQUE,
  course        VARCHAR(120) NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Teachers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teachers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(60)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(120) NOT NULL,
  subject       VARCHAR(120) NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Admins ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(60)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(120) NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Attendance ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT          NOT NULL,
  date        DATE         NOT NULL,
  status      ENUM('present','absent') NOT NULL DEFAULT 'present',
  subject     VARCHAR(120) NOT NULL,
  marked_by   VARCHAR(120) NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_date_subject (student_id, date, subject),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ── Seed demo data ───────────────────────────────────────────
-- Passwords are bcrypt hashes of the plain-text shown in comments
INSERT IGNORE INTO students (username, password_hash, name, roll_no, course) VALUES
  ('alice', '$2b$12$PLACEHOLDER_HASH_alice', 'Alice Johnson', 'CS2024001', 'Computer Science'),
  ('bob',   '$2b$12$PLACEHOLDER_HASH_bob',   'Bob Smith',    'CS2024002', 'Computer Science'),
  ('carol', '$2b$12$PLACEHOLDER_HASH_carol', 'Carol Davis',  'CS2024003', 'Computer Science');

INSERT IGNORE INTO teachers (username, password_hash, name, subject) VALUES
  ('prof_kumar',  '$2b$12$PLACEHOLDER_HASH_kumar',  'Prof. Raj Kumar',    'Mathematics'),
  ('prof_sharma', '$2b$12$PLACEHOLDER_HASH_sharma', 'Prof. Anita Sharma', 'Physics');

INSERT IGNORE INTO admins (username, password_hash, name) VALUES
  ('admin', '$2b$12$PLACEHOLDER_HASH_admin', 'System Administrator');

-- Generate real hashes with:
--   python -c "import bcrypt; print(bcrypt.hashpw(b'alice123', bcrypt.gensalt()).decode())"
`;

// ─────────────────────────────────────────────────────────────
//  2.  Python Flask Backend  (app.py)
// ─────────────────────────────────────────────────────────────
export const PYTHON_APP = `
"""
AttendTrack – Python Flask Backend
===================================
Install:
    pip install flask flask-cors mysql-connector-python PyJWT bcrypt python-dotenv

.env file:
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=yourpassword
    DB_NAME=attendtrack
    SECRET_KEY=your_jwt_secret

Run:
    python app.py
"""

import os, datetime
import jwt, bcrypt
import mysql.connector
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from functools import wraps

load_dotenv()
app = Flask(__name__)
CORS(app)

SECRET_KEY = os.getenv("SECRET_KEY", "attendtrack_secret_2026")
ELIGIBILITY_THRESHOLD = 75


def get_db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "attendtrack"),
    )


def create_token(user_id, role):
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def token_required(allowed_roles=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = request.headers.get("Authorization", "").replace("Bearer ", "")
            if not token:
                return jsonify({"error": "Token missing"}), 401
            try:
                data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
                return jsonify({"error": str(e)}), 401
            if allowed_roles and data["role"] not in allowed_roles:
                return jsonify({"error": "Forbidden"}), 403
            return f(data, *args, **kwargs)
        return decorated
    return decorator


# ── Auth ──────────────────────────────────────────────────────
@app.route("/api/login", methods=["POST"])
def login():
    body     = request.get_json()
    role     = body.get("role")
    username = body.get("username", "").strip()
    password = body.get("password", "")

    if role not in ("student", "teacher", "admin"):
        return jsonify({"error": "Invalid role"}), 400

    table_map = {"student": "students", "teacher": "teachers", "admin": "admins"}
    db = get_db()
    cur = db.cursor(dictionary=True)
    cur.execute(f"SELECT * FROM {table_map[role]} WHERE username = %s", (username,))
    user = cur.fetchone()
    cur.close(); db.close()

    if not user or not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_token(user["id"], role)
    user.pop("password_hash", None)
    return jsonify({"token": token, "user": user, "role": role})


# ── Student ───────────────────────────────────────────────────
@app.route("/api/student/attendance", methods=["GET"])
@token_required(["student"])
def student_attendance(td):
    db = get_db(); cur = db.cursor(dictionary=True)
    cur.execute(
        "SELECT id, date, status, subject, marked_by FROM attendance "
        "WHERE student_id = %s ORDER BY date ASC", (td["user_id"],)
    )
    records = cur.fetchall()
    cur.close(); db.close()

    total   = len(records)
    present = sum(1 for r in records if r["status"] == "present")
    pct     = round(present / total * 100) if total else 0

    for r in records:
        r["date"] = str(r["date"])

    return jsonify({
        "records": records,
        "stats": {
            "total": total, "present": present,
            "absent": total - present, "percentage": pct,
            "eligible": pct >= ELIGIBILITY_THRESHOLD,
        },
    })


# ── Teacher ───────────────────────────────────────────────────
@app.route("/api/teacher/students", methods=["GET"])
@token_required(["teacher"])
def get_students(td):
    db = get_db(); cur = db.cursor(dictionary=True)
    cur.execute("SELECT id, name, roll_no, course FROM students ORDER BY roll_no")
    rows = cur.fetchall()
    cur.close(); db.close()
    return jsonify(rows)


@app.route("/api/teacher/attendance", methods=["POST"])
@token_required(["teacher"])
def mark_attendance(td):
    body    = request.get_json()
    records = body.get("records", [])
    db = get_db(); cur = db.cursor(dictionary=True)
    cur.execute("SELECT name FROM teachers WHERE id = %s", (td["user_id"],))
    teacher_name = (cur.fetchone() or {}).get("name", "Teacher")
    for rec in records:
        cur.execute(
            "INSERT INTO attendance (student_id, date, status, subject, marked_by) "
            "VALUES (%s, %s, %s, %s, %s) "
            "ON DUPLICATE KEY UPDATE status=VALUES(status), marked_by=VALUES(marked_by)",
            (rec["student_id"], rec["date"], rec["status"], rec["subject"], teacher_name),
        )
    db.commit(); cur.close(); db.close()
    return jsonify({"message": "Saved", "count": len(records)})


@app.route("/api/teacher/attendance/all", methods=["GET"])
@token_required(["teacher"])
def teacher_view_all(td):
    db = get_db(); cur = db.cursor(dictionary=True)
    cur.execute(
        "SELECT a.id, a.date, a.status, a.subject, a.marked_by, "
        "s.name AS student_name, s.roll_no "
        "FROM attendance a JOIN students s ON s.id = a.student_id "
        "ORDER BY a.date ASC, s.roll_no"
    )
    rows = cur.fetchall()
    for r in rows: r["date"] = str(r["date"])
    cur.close(); db.close()
    return jsonify(rows)


# ── Admin ─────────────────────────────────────────────────────
@app.route("/api/admin/attendance", methods=["GET"])
@token_required(["admin"])
def admin_all(td):
    db = get_db(); cur = db.cursor(dictionary=True)
    cur.execute(
        "SELECT a.id, a.date, a.status, a.subject, a.marked_by, "
        "s.name AS student_name, s.roll_no "
        "FROM attendance a JOIN students s ON s.id = a.student_id "
        "ORDER BY a.date ASC, s.roll_no"
    )
    rows = cur.fetchall()
    for r in rows: r["date"] = str(r["date"])
    cur.close(); db.close()
    return jsonify(rows)


@app.route("/api/admin/attendance/<int:rid>", methods=["PUT"])
@token_required(["admin"])
def update_rec(td, rid):
    body = request.get_json()
    fields = {k: body[k] for k in ("status", "date", "subject") if k in body}
    if not fields:
        return jsonify({"error": "No valid fields"}), 400
    db = get_db(); cur = db.cursor()
    sql = "UPDATE attendance SET " + ", ".join(f"{k}=%s" for k in fields) + " WHERE id=%s"
    cur.execute(sql, list(fields.values()) + [rid])
    db.commit(); n = cur.rowcount; cur.close(); db.close()
    return jsonify({"message": "Updated"}) if n else (jsonify({"error": "Not found"}), 404)


@app.route("/api/admin/attendance/<int:rid>", methods=["DELETE"])
@token_required(["admin"])
def delete_rec(td, rid):
    db = get_db(); cur = db.cursor()
    cur.execute("DELETE FROM attendance WHERE id=%s", (rid,))
    db.commit(); n = cur.rowcount; cur.close(); db.close()
    return jsonify({"message": "Deleted"}) if n else (jsonify({"error": "Not found"}), 404)


@app.route("/api/admin/summary", methods=["GET"])
@token_required(["admin"])
def admin_summary(td):
    db = get_db(); cur = db.cursor(dictionary=True)
    cur.execute(
        "SELECT s.id, s.name, s.roll_no, s.course, "
        "COUNT(a.id) AS total, SUM(a.status='present') AS present_count "
        "FROM students s LEFT JOIN attendance a ON a.student_id=s.id "
        "GROUP BY s.id ORDER BY s.roll_no"
    )
    rows = cur.fetchall(); cur.close(); db.close()
    result = []
    for r in rows:
        t = int(r["total"] or 0); p = int(r["present_count"] or 0)
        pct = round(p / t * 100) if t else 0
        result.append({**r, "total": t, "present": p, "absent": t - p,
                        "percentage": pct, "eligible": pct >= ELIGIBILITY_THRESHOLD})
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
`;

// ─────────────────────────────────────────────────────────────
//  3.  .env template  (copy to .env and fill in your values)
// ─────────────────────────────────────────────────────────────
export const DOTENV_TEMPLATE = `
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=attendtrack
SECRET_KEY=change_me_to_a_random_string
`;
