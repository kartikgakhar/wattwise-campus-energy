import os
import re
import hmac
from datetime import timedelta
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv
from flask import Flask, abort, jsonify, redirect, request, send_from_directory, session
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()

ROOT = Path(__file__).resolve().parent.parent
app = Flask(__name__, static_folder=None)
app.secret_key = os.getenv("SESSION_SECRET", "")
app.config.update(
    SESSION_COOKIE_NAME="wattwise.sid",
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.getenv("NODE_ENV") == "production",
    PERMANENT_SESSION_LIFETIME=timedelta(days=7),
    MAX_CONTENT_LENGTH=4 * 1024 * 1024,
)

if len(app.secret_key) < 32:
    raise RuntimeError("Set SESSION_SECRET in server/.env to a random value at least 32 characters long.")

BUILDINGS = ["Library", "Science Block", "Student Centre", "Residence Hall"]
ISSUES = [
    "Lights left on",
    "Fans running in an empty room",
    "AC running with windows open",
    "Equipment left on standby",
    "Other energy waste",
]
STATUSES = ["open", "check", "done"]
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        database=os.getenv("DB_NAME", "wattwise"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        charset="utf8mb4",
    )


def error(message, status=400):
    return jsonify(error=message), status


def authenticated_user():
    user = session.get("user")
    if not user:
        return None, error("Sign in to continue.", 401)
    return user, None


def admin_user():
    user, response = authenticated_user()
    if response:
        return None, response
    if user.get("role") != "admin":
        return None, error("Facilities admin access is required.", 403)
    return user, None


def iso(value):
    return value.isoformat() if value else None


@app.get("/api/health")
def health():
    try:
        connection = db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        connection.close()
        return jsonify(ok=True, database="connected")
    except mysql.connector.Error:
        app.logger.exception("MySQL health check failed")
        return error("Cannot connect to MySQL. Check server/.env and run schema.sql.", 503)


@app.post("/api/auth/register")
def register():
    body = request.get_json(silent=True) or {}
    name = str(body.get("name", "")).strip()
    email = str(body.get("email", "")).strip().lower()
    password = str(body.get("password", ""))
    role = str(body.get("role", "student")).strip().lower()
    admin_key = str(body.get("adminKey", ""))
    if role not in {"student", "admin"}:
        return error("Choose Student or Facilities admin.")
    if role == "admin":
        configured_key = os.getenv("ADMIN_SIGNUP_KEY", "")
        if not configured_key:
            return error("Facilities admin access is not enabled. Ask the campus administrator.", 403)
        if not hmac.compare_digest(admin_key, configured_key):
            return error("Facilities access key is incorrect.", 403)
    if len(name) < 2 or len(name) > 80:
        return error("Enter a name between 2 and 80 characters.")
    if len(email) > 254 or not EMAIL_RE.match(email):
        return error("Enter a valid email address.")
    if len(password) < 8 or len(password) > 72:
        return error("Password must be 8 to 72 characters.")

    connection = db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, %s)",
            (name, email, generate_password_hash(password), role),
        )
        user = {"id": cursor.lastrowid, "name": name, "email": email, "role": role}
        connection.commit()
        session.clear()
        session["user"] = user
        session.permanent = True
        return jsonify(user=user), 201
    except mysql.connector.IntegrityError:
        connection.rollback()
        return error("An account with this email already exists.", 409)
    finally:
        cursor.close()
        connection.close()


@app.post("/api/auth/login")
def login():
    body = request.get_json(silent=True) or {}
    email = str(body.get("email", "")).strip().lower()
    password = str(body.get("password", ""))
    requested_role = str(body.get("role", "")).strip().lower()
    admin_key = str(body.get("adminKey", ""))
    if requested_role and requested_role not in {"student", "admin"}:
        return error("Choose Student or Facilities admin.")
    if requested_role == "admin":
        configured_key = os.getenv("ADMIN_SIGNUP_KEY", "")
        if not configured_key:
            return error("Facilities admin access is not enabled. Ask the campus administrator.", 403)
        if not hmac.compare_digest(admin_key, configured_key):
            return error("Facilities access key is incorrect.", 403)
    connection = db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, name, email, role, password_hash FROM users WHERE email = %s", (email,))
        row = cursor.fetchone()
    finally:
        cursor.close()
        connection.close()
    if not row or not check_password_hash(row["password_hash"], password):
        return error("Email or password is incorrect.", 401)
    if requested_role and row["role"] != requested_role:
        expected = "Facilities admin" if row["role"] == "admin" else "Student"
        return error(f"This account is registered as {expected}. Choose that account type and try again.", 403)
    user = {key: row[key] for key in ("id", "name", "email", "role")}
    session.clear()
    session["user"] = user
    session.permanent = True
    return jsonify(user=user)


@app.get("/api/auth/me")
def auth_me():
    return jsonify(user=session.get("user"))


@app.post("/api/auth/logout")
def logout():
    session.clear()
    return "", 204


@app.get("/api/buildings")
def list_buildings():
    _, response = authenticated_user()
    if response:
        return response
    connection = db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT b.id, b.name, b.code,
              COUNT(r.id) AS totalReports,
              COALESCE(SUM(r.id IS NOT NULL AND r.status <> 'done'), 0) AS activeReports,
              COALESCE(SUM(r.status = 'done'), 0) AS resolvedReports
            FROM buildings b LEFT JOIN reports r ON r.building_id = b.id
            GROUP BY b.id ORDER BY b.id
        """)
        return jsonify(buildings=cursor.fetchall())
    finally:
        cursor.close()
        connection.close()


@app.get("/api/reports")
def list_reports():
    user, response = authenticated_user()
    if response:
        return response
    connection = db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        where = "" if user["role"] == "admin" else "WHERE r.reporter_id = %s"
        params = () if user["role"] == "admin" else (user["id"],)
        cursor.execute(f"""
            SELECT r.id, r.room, r.issue_type AS issue, r.details, r.photo_data AS photo,
              r.status, r.response, r.created_at AS createdAt, r.updated_at AS updatedAt,
              b.name AS building, u.name AS reporterName, u.email AS reporterEmail
            FROM reports r
            JOIN buildings b ON b.id = r.building_id
            JOIN users u ON u.id = r.reporter_id
            {where}
            ORDER BY r.created_at DESC LIMIT 500
        """, params)
        rows = cursor.fetchall()
        for row in rows:
            row["createdAt"] = iso(row["createdAt"])
            row["updatedAt"] = iso(row["updatedAt"])
        return jsonify(reports=rows)
    finally:
        cursor.close()
        connection.close()


@app.post("/api/reports")
def create_report():
    user, response = authenticated_user()
    if response:
        return response
    if user.get("role") != "student":
        return error("Only campus reporters can submit reports.", 403)
    body = request.get_json(silent=True) or {}
    building = str(body.get("building", ""))
    room = str(body.get("room", "")).strip()
    issue = str(body.get("issue", ""))
    details = str(body.get("details", "")).strip()
    photo = body.get("photo")
    if building not in BUILDINGS:
        return error("Choose a valid campus building.")
    if not room or len(room) > 120:
        return error("Enter a room or area (up to 120 characters).")
    if issue not in ISSUES:
        return error("Choose a valid issue type.")
    if len(details) > 5000:
        return error("Details must be 5,000 characters or fewer.")
    if photo and (not isinstance(photo, str) or not photo.startswith("data:image/") or len(photo) > 2_500_000):
        return error("Photo must be an image under 2 MB after compression.")

    connection = db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT id FROM buildings WHERE name = %s", (building,))
        building_row = cursor.fetchone()
        cursor.execute(
            "INSERT INTO reports (reporter_id, building_id, room, issue_type, details, photo_data) VALUES (%s, %s, %s, %s, %s, %s)",
            (user["id"], building_row[0], room, issue, details or None, photo),
        )
        report_id = cursor.lastrowid
        connection.commit()
        return jsonify(id=report_id), 201
    finally:
        cursor.close()
        connection.close()


@app.patch("/api/reports/<int:report_id>")
def update_report(report_id):
    user, response = admin_user()
    if response:
        return response
    body = request.get_json(silent=True) or {}
    status = str(body.get("status", ""))
    note = str(body.get("response", "")).strip()
    if status not in STATUSES:
        return error("Choose a valid report status.")
    if len(note) > 5000:
        return error("Response must be 5,000 characters or fewer.")

    connection = db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        connection.start_transaction()
        cursor.execute("SELECT status FROM reports WHERE id = %s FOR UPDATE", (report_id,))
        row = cursor.fetchone()
        if not row:
            connection.rollback()
            return error("Report not found.", 404)
        cursor.execute("UPDATE reports SET status = %s, response = %s WHERE id = %s", (status, note or None, report_id))
        cursor.execute(
            "INSERT INTO report_updates (report_id, actor_id, old_status, new_status, response) VALUES (%s, %s, %s, %s, %s)",
            (report_id, user["id"], row["status"], status, note or None),
        )
        connection.commit()
        return jsonify(ok=True)
    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()


@app.get("/")
def home():
    return send_from_directory(ROOT, "index.html")


@app.get("/admin.html")
def admin_page():
    if session.get("user", {}).get("role") != "admin":
        return redirect("/")
    return send_from_directory(ROOT, "admin.html")


@app.get("/<path:filename>")
def frontend_file(filename):
    target = (ROOT / filename).resolve()
    if target.parent != ROOT or filename.startswith(".") or not target.is_file():
        abort(404)
    return send_from_directory(ROOT, filename)


@app.errorhandler(mysql.connector.Error)
def mysql_error(exc):
    app.logger.exception("Database request failed: %s", exc)
    return error("Database error. Check the backend terminal for details.", 500)


@app.errorhandler(413)
def request_too_large(_exc):
    return error("Request is too large. Use a smaller photo.", 413)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "3000")), debug=os.getenv("FLASK_DEBUG") == "1")
