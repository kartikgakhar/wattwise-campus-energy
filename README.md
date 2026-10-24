# WattWise

WattWise is a campus energy-awareness prototype. Students can report visible energy waste, follow their reports, and take part in a weekly room-check challenge. Facilities admins can review reports, update their status, and leave a response for the student.

## What it demonstrates

- Student sign-up and sign-in, with separate facilities-admin access
- Energy issue reports with a campus building, room or area, details, and optional photo
- A student report list and status updates
- An admin queue for reviewing and resolving reports
- Campus building summaries, a community leaderboard, and a weekly room-check challenge
- Light and dark themes

The project is a hackathon prototype. It does not connect to campus meters or independently measure electricity use or savings.

## Run it locally

### Requirements

- Python 3.10 or newer
- MySQL Server 8 or newer

### 1. Set up the database

Open `server/schema.sql` in MySQL Workbench and run it. The script creates the WattWise database and its tables.

### 2. Configure the server

In PowerShell, from the project folder:

```powershell
cd server
py -m venv .venv
Copy-Item .env.example .env
```

Edit `server/.env` with your local MySQL settings. Set a random `SESSION_SECRET` of at least 32 characters and a private `ADMIN_SIGNUP_KEY`. Keep this file private; it is excluded from Git.

### 3. Install and start Flask

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe app.py
```

Open <http://127.0.0.1:3000>. Keep the Flask terminal running while using the site. The health endpoint is <http://127.0.0.1:3000/api/health>.

For admin setup, see [`server/README.md`](server/README.md).

## Main files

- `index.html`, `styles.css`, `app.js` — student workspace and report flow
- `admin.html`, `admin.css`, `admin.js` — facilities workspace
- `landing.css`, `landing.js` — public landing page
- `server/app.py` — Flask API and static file server
- `server/schema.sql` — MySQL schema and campus buildings
- `server/.env.example` — safe configuration template

## Security note

Never upload `server/.env`, database passwords, session secrets, admin keys, or real account credentials. Use dummy accounts when recording a demo. Before a real campus launch, deploy behind HTTPS and have the university review account provisioning and data handling.
