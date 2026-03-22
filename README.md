# CMMC Dashboard

Internal compliance tracking dashboard for CMMC Level 2 and ITAR overlay work.

![Overview](docs/screenshots/overview.png)

This project is designed for a small trusted user set. It is not intended to be a public-facing multi-tenant product. The current system provides:

- authenticated access with role-based access control (viewer / editor / admin)
- CMMC Level 2 and ITAR practice tracking across all 14 domains
- SPRS score calculation and compliance gauge
- evidence management — attach files and URLs to practices
- POA&M tracking with milestone progress
- activity history across all practice changes
- assessment report export (print to PDF via Ctrl+P)
- admin user management UI

---

## Installation Guide

Follow these steps in order. This should take about 10 minutes on a fresh machine.

### Step 1 — Install Docker Desktop

Docker runs the app and database in containers so you don't need to install anything else manually.

1. Go to [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Download the version for your operating system (Mac or Windows)
3. Install it and open Docker Desktop
4. Wait until the Docker icon in your menu bar / taskbar shows **"Docker Desktop is running"**

### Step 2 — Accept the GitHub invitation

You should have received an email from GitHub with an invitation to access this repository. Click **Accept invitation** in that email before continuing.

### Step 3 — Download the code

1. Go to [https://github.com/gtj105/cmmc-dashboard](https://github.com/gtj105/cmmc-dashboard)
2. Click the green **Code** button
3. Click **Download ZIP**
4. Unzip the downloaded file — you'll get a folder called `cmmc-dashboard-master`
5. Move that folder somewhere easy to find, like your Desktop or Documents

> If you're comfortable with Git, you can also run: `git clone https://github.com/gtj105/cmmc-dashboard.git`

### Step 4 — Open a terminal in the project folder

**On Mac:**
1. Open the `cmmc-dashboard-master` folder in Finder
2. Right-click anywhere inside the folder and select **New Terminal at Folder**
   *(or open Terminal from Applications → Utilities, then drag the folder onto the Terminal window)*

**On Windows:**
1. Open the `cmmc-dashboard-master` folder in File Explorer
2. Click in the address bar at the top, type `cmd`, and press Enter

### Step 5 — Create your environment file

In the terminal, run:

```bash
cp .env.example .env.local
```

Then open `.env.local` in any text editor (Notepad, TextEdit, VS Code) and replace `change-me` with a strong random secret.

**To generate a strong secret — pick one of these methods:**

- **Mac/Linux terminal:** `openssl rand -base64 32` — copy the output and paste it in
- **Windows terminal:** `powershell -command "[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))"` — copy the output and paste it in
- **Online generator:** go to [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) and copy the value shown

Your `.env.local` should look like this when done:

```
NEXTAUTH_SECRET=aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890abcd
DATABASE_URL=postgres://postgres:postgres@localhost:5432/cmmc
ORG_NAME=Your Organization Name
```

Save the file.

### Step 6 — Start the app

In the terminal, run:

```bash
docker compose up -d
```

This will download and start everything automatically. The first run takes 2–5 minutes depending on your internet connection. You'll see Docker pulling images and building the app — that's normal.

When it finishes and you see your terminal prompt return, the app is ready.

### Step 7 — Open the dashboard

Open your browser and go to:

```
http://localhost/login
```

Log in with the default admin account:

- **Email:** `admin@localhost`
- **Password:** `admin`

> Change this password immediately after your first login via the user management commands below.

---

## Starting and Stopping

Start the app (after initial setup):

```bash
docker compose up -d
```

Stop the app:

```bash
docker compose down
```

The database persists between stops. Your data is not lost when you stop.

---

## User Roles

- `viewer` — read-only access
- `editor` — can update practices and create/update POA&M items
- `admin` — full access including deleting POA&M items

## Common Commands

Start the stack:

```bash
docker compose up -d
```

Stop the stack:

```bash
docker compose down
```

Reset and reseed blank local data:

```bash
docker compose down -v
docker compose up -d db
npm run seed
docker compose up -d app nginx
```

Create a user:

```bash
npm run create-user -- --email user@example.com --name "User Name" --role viewer
```

List users:

```bash
npm run list-users
```

Change role:

```bash
npm run set-role -- --email user@example.com --role editor
```

Export data:

```bash
npm run export-data -- --file exports/dashboard-backup.json
```

Import data into a fresh or reset dashboard:

```bash
npm run import-data -- --file exports/dashboard-backup.json --wipe
```

## Documentation

- [Operational Runbook](./docs/RUNBOOK.md)
- [Security and Operations Notes](./docs/SECURITY-AND-OPERATIONS.md)

## Notes

- the local database is published only on `127.0.0.1:5432`
- the export file contains sensitive compliance data and password hashes
- import is intended for restore/migration, not merge
