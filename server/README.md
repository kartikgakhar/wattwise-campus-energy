# WattWise Python backend

This folder contains the Flask API and MySQL schema for real accounts and shared campus reports.

## Requirements

- Python 3.10 or newer
- MySQL Server 8 or newer

## 1. Create the database

Open MySQL Workbench, connect to your local MySQL server, open `schema.sql`, and run it. It creates the `wattwise` database and the user, building, report, and report update tables, plus the four buildings used by the interface.

## 2. Configure the backend

Open PowerShell in this `server` folder and make a virtual environment:

```powershell
py -m venv .venv
Copy-Item .env.example .env
```

Edit `.env` with your MySQL username and password. Replace `SESSION_SECRET` with a long random value. Set `ADMIN_SIGNUP_KEY` to a private key that only the university gives to facilities staff. Keep `.env` private; do not commit or share the database password or admin key.

Install the Python packages and start the server:

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe app.py
```

Open `http://127.0.0.1:3000`. The health endpoint at `http://127.0.0.1:3000/api/health` should return `{"ok":true,"database":"connected"}`.

## 3. Create a facilities account

On the WattWise sign-up screen, choose **Facilities admin**, enter the key provided by the university, and create the account. The backend checks the key against `ADMIN_SIGNUP_KEY` and assigns the `admin` role. At every sign-in, choose **Facilities admin** and enter the same key along with that account's email and password. Student accounts do not need the key.

If `ADMIN_SIGNUP_KEY` is empty, public admin sign-up is disabled. To grant admin to an existing account instead, run this from the `server` folder:

```powershell
.venv\Scripts\python.exe make_admin.py facilities@your-college.edu
```

Sign out and sign in again for the new role to take effect. Keep the key private and rotate it by changing `ADMIN_SIGNUP_KEY` in `.env` and restarting Flask if it is shared beyond the intended staff.

## API routes

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/buildings`
- `GET /api/reports` (students see their own reports; admins see the campus queue)
- `POST /api/reports` (signed-in students)
- `PATCH /api/reports/:id` (admin only; records status and response history)

Passwords are hashed. Sign-in uses a signed, HTTP-only browser session cookie. Report photos are stored as data in MySQL for this prototype; object storage is a better fit before deployment.
