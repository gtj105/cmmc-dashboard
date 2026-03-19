# CMMC Level 2 Compliance Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully self-hosted CMMC Level 2 compliance tracking dashboard for CISO/security leadership, tracking all 110 practices across 14 domains with ITAR overlay, running via Docker Compose.

**Architecture:** Next.js 14 App Router with server components for data fetching, API routes for all DB writes, and Postgres 15 as the sole data store. Auth via NextAuth.js credentials provider. Nginx reverse proxies port 80 → 3000. No ORM — direct SQL via `postgres` (postgres.js) library.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts, NextAuth.js, postgres.js, Postgres 15, Nginx, Docker Compose

---

## Vault Alignment Notes

Files reviewed in `/Users/gtj105/Documents/obsidian/obsidian_vault/01 Projects/CMMC Master Library/`:
- **14 domains confirmed:** AC, AT, AU, CA, CM, IA, IR, MA, MP, PE, PS, RA, SC, SI
- **Control ID format:** `AC.L2-3.1.1` (domain.level-nist_ref)
- **Status fields match vault:** maps `partially-implemented` → `In Progress`, `not-started` → `Not Started`, `implemented` → `Implemented`, `audit-ready` → `Audit Ready`
- **Owner field** is free text (e.g., "Security Engineering")
- **Evidence flag** is boolean — vault uses `evidence_readiness: partial/full/none`
- Vault control template confirms: `ciso_assistant.score`, `observations`, `assessment_status` — these map to our `notes` and `status` columns

---

## File Tree

```
dashboard/
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json
├── scripts/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx                          ← redirect → /overview
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── overview/
│   │   │   └── page.tsx
│   │   ├── domain/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── itar/
│   │   │   └── page.tsx
│   │   ├── risk/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── overview/
│   │       │   └── route.ts                  ← KPI aggregations
│   │       ├── domains/
│   │       │   └── route.ts                  ← domain list + per-domain stats
│   │       ├── practices/
│   │       │   ├── route.ts                  ← list (filtered)
│   │       │   └── [id]/
│   │       │       └── route.ts              ← PATCH: status/evidence/owner/due_date/notes
│   │       ├── burndown/
│   │       │   └── route.ts                  ← 90-day time series
│   │       └── risk/
│   │           └── route.ts                  ← high+critical across frameworks
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx                  ← wraps sidebar + main, handles auth session
│   │   │   ├── TopNav.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── RiskBadge.tsx
│   │   ├── FrameworkBadge.tsx
│   │   ├── PracticeTable.tsx                 ← shared table for domain + ITAR pages
│   │   └── ui/                               ← shadcn auto-generated (do not hand-edit)
│   └── lib/
│       ├── db.ts                             ← postgres.js singleton
│       ├── auth.ts                           ← NextAuth config + options export
│       └── types.ts                          ← shared TypeScript types
```

---

## Domain Reference (14 CMMC Domains, 110 Practices Total)

| Abbr | Full Name | Practice Count | NIST Ref |
|------|-----------|---------------|----------|
| AC | Access Control | 22 | 3.1.x |
| AT | Awareness and Training | 3 | 3.2.x |
| AU | Audit and Accountability | 9 | 3.3.x |
| CA | Security Assessment | 4 | 3.12.x |
| CM | Configuration Management | 9 | 3.4.x |
| IA | Identification and Authentication | 11 | 3.5.x |
| IR | Incident Response | 3 | 3.6.x |
| MA | Maintenance | 6 | 3.7.x |
| MP | Media Protection | 9 | 3.8.x |
| PE | Physical Protection | 6 | 3.10.x |
| PS | Personnel Security | 2 | 3.9.x |
| RA | Risk Assessment | 3 | 3.11.x |
| SC | System and Communications Protection | 16 | 3.13.x |
| SI | System and Information Integrity | 7 | 3.14.x |

ITAR overlay: ~20 controls across 5 categories (Personnel, Data Residency, Access Boundary, Disclosure, Training)

---

## Task 1: Project Scaffold

**Files:**
- Create: `dashboard/package.json`
- Create: `dashboard/tsconfig.json`
- Create: `dashboard/next.config.ts`
- Create: `dashboard/tailwind.config.ts`
- Create: `dashboard/postcss.config.mjs`
- Create: `dashboard/components.json`

- [ ] **Step 1: Initialize package.json**

```json
{
  "name": "cmmc-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "seed": "tsx scripts/seed.ts"
  },
  "dependencies": {
    "next": "14.2.18",
    "react": "^18",
    "react-dom": "^18",
    "next-auth": "^4.24.11",
    "postgres": "^3.4.4",
    "recharts": "^2.12.7",
    "bcryptjs": "^2.4.3",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-badge": "latest",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.1",
    "@radix-ui/react-slot": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.454.0",
    "tailwind-merge": "^2.5.4",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5",
    "tailwindcss": "^3.4.14",
    "autoprefixer": "^10.4.20",
    "postcss": "^8",
    "tsx": "^4.19.1"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.ts**

```typescript
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {}
export default nextConfig
```

- [ ] **Step 4: Create tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'
export default {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

- [ ] **Step 5: Create postcss.config.mjs**

```mjs
const config = { plugins: { tailwindcss: {}, autoprefixer: {} } }
export default config
```

- [ ] **Step 6: Create components.json** (shadcn config)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

---

## Task 2: Infrastructure Files

**Files:**
- Create: `dashboard/.env.example`
- Create: `dashboard/Dockerfile`
- Create: `dashboard/docker-compose.yml`
- Create: `dashboard/nginx.conf`

- [ ] **Step 1: Create .env.example**

```bash
# Database
DATABASE_URL=postgres://cmmc_user:changeme@db:5432/cmmc_db

# NextAuth
NEXTAUTH_SECRET=replace-with-32-char-random-string
NEXTAUTH_URL=http://localhost

# App
ORG_NAME=Acme Defense LLC
```

- [ ] **Step 2: Create Dockerfile**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

- [ ] **Step 3: Update next.config.ts to enable standalone output**

```typescript
import type { NextConfig } from 'next'
const nextConfig: NextConfig = { output: 'standalone' }
export default nextConfig
```

- [ ] **Step 4: Create docker-compose.yml**

```yaml
version: '3.9'

services:
  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: cmmc_db
      POSTGRES_USER: cmmc_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cmmc_user -d cmmc_db"]
      interval: 5s
      timeout: 5s
      retries: 10

  app:
    build: .
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgres://cmmc_user:${POSTGRES_PASSWORD:-changeme}@db:5432/cmmc_db
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost}
      ORG_NAME: ${ORG_NAME:-My Organization}
    expose:
      - "3000"

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app

volumes:
  pgdata:
```

- [ ] **Step 5: Create nginx.conf**

```nginx
events {
  worker_connections 1024;
}

http {
  upstream nextjs {
    server app:3000;
  }

  server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    location / {
      proxy_pass http://nextjs;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_cache_bypass $http_upgrade;
    }
  }
}
```

---

## Task 3: Database Layer

**Files:**
- Create: `dashboard/src/lib/db.ts`
- Create: `dashboard/src/lib/types.ts`
- Create: `dashboard/scripts/seed.ts`

- [ ] **Step 1: Create src/lib/db.ts**

```typescript
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!
const sql = postgres(connectionString, { max: 10 })
export default sql
```

- [ ] **Step 2: Create src/lib/types.ts**

```typescript
export type Status = 'Not Started' | 'In Progress' | 'Implemented' | 'Audit Ready'
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'
export type Framework = 'CMMC' | 'ITAR'

export interface Domain {
  id: number
  name: string
  abbreviation: string
  framework: Framework
  description: string
}

export interface Practice {
  id: number
  domain_id: number
  framework: Framework
  practice_id: string
  title: string
  description: string
  status: Status
  risk_level: RiskLevel
  owner: string | null
  due_date: string | null
  evidence_exists: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DomainWithStats extends Domain {
  total: number
  implemented: number
  audit_ready: number
  in_progress: number
  not_started: number
  completion_pct: number
}

export interface OverviewStats {
  total: number
  not_started: number
  in_progress: number
  implemented: number
  audit_ready: number
  score_pct: number
  itar_total: number
  itar_implemented: number
  itar_score_pct: number
  last_assessment_date: string | null
}
```

- [ ] **Step 3: Create scripts/seed.ts** — full seed with 110 CMMC practices + ITAR controls

The seed must:
1. Create tables (domains, practices, users) if not exists
2. Insert 14 CMMC domains
3. Insert all 110 practices with realistic default risk levels (see mapping below)
4. Insert ITAR domain + 20 ITAR controls
5. Insert default admin user (email: admin@localhost, password: admin — hashed with bcrypt)

**Risk level defaults by domain (seed heuristic — users change in UI):**
- AC: practices 1-7 = High, 8-11 = Medium, 12-22 = High (remote access = High)
- AT: all Medium
- AU: 1-2 = High, 3-9 = Medium
- CA: all Medium
- CM: 1-2 = High, rest = Medium
- IA: 3 (MFA) = Critical, 7-8 (passwords) = High, rest = Medium
- IR: all High
- MA: 5 (MFA for remote maint) = Critical, rest = Medium
- MP: 3 (sanitize/destroy) = High, 6 (crypto transport) = High, rest = Medium
- PE: all Medium
- PS: 2 (termination) = High, 1 = Medium
- RA: 2-3 (vuln scanning/remediation) = High, 1 = Medium
- SC: 8 (crypto CUI) = Critical, 11 (FIPS) = Critical, 16 (CUI at rest) = Critical, rest = High
- SI: 2-5 (malware/AV) = High, 6-7 = High, 1 = Medium

Full practice list (insert all with `status = 'Not Started'` as default):

```sql
-- AC domain (id = 1)
('AC.L2-3.1.1', 'Limit System Access to Authorized Users', 'Limit information system access to authorized users, processes acting on behalf of authorized users, and devices (including other systems).', 'High'),
('AC.L2-3.1.2', 'Limit System Access to Types of Transactions and Functions', 'Limit information system access to the types of transactions and functions that authorized users are permitted to execute.', 'High'),
('AC.L2-3.1.3', 'Control CUI Flow', 'Control the flow of CUI in accordance with approved authorizations.', 'High'),
('AC.L2-3.1.4', 'Separate Duties of Individuals', 'Separate the duties of individuals to reduce the risk of malevolent activity without collusion.', 'High'),
('AC.L2-3.1.5', 'Employ Least Privilege', 'Employ the principle of least privilege, including for specific security functions and privileged accounts.', 'High'),
('AC.L2-3.1.6', 'Use Non-Privileged Accounts or Roles', 'Use non-privileged accounts or roles when accessing non-security functions.', 'Medium'),
('AC.L2-3.1.7', 'Prevent Non-Privileged Users from Executing Privileged Functions', 'Prevent non-privileged users from executing privileged functions and capture the execution of such functions in audit logs.', 'High'),
('AC.L2-3.1.8', 'Limit Unsuccessful Logon Attempts', 'Limit unsuccessful logon attempts.', 'Medium'),
('AC.L2-3.1.9', 'Provide Privacy and Security Notices', 'Provide privacy and security notices consistent with CUI rules.', 'Low'),
('AC.L2-3.1.10', 'Use Session Lock', 'Use session lock with pattern-hiding displays after a period of inactivity.', 'Medium'),
('AC.L2-3.1.11', 'Terminate Sessions', 'Terminate (automatically) a user session after a defined condition.', 'Medium'),
('AC.L2-3.1.12', 'Monitor and Control Remote Access Sessions', 'Monitor and control remote access sessions.', 'High'),
('AC.L2-3.1.13', 'Employ Cryptographic Mechanisms to Protect CUI During Transmission', 'Employ cryptographic mechanisms to protect the confidentiality of remote access sessions.', 'High'),
('AC.L2-3.1.14', 'Route Remote Access via Managed Access Control Points', 'Route remote access via managed access control points.', 'High'),
('AC.L2-3.1.15', 'Authorize Remote Execution of Privileged Commands', 'Authorize remote execution of privileged commands and access to security-relevant information via remote access only for documented operational needs.', 'High'),
('AC.L2-3.1.16', 'Authorize Wireless Access Prior to Allowing Such Connections', 'Authorize wireless access prior to allowing such connections.', 'High'),
('AC.L2-3.1.17', 'Protect Wireless Access Using Authentication and Encryption', 'Protect wireless access using authentication and encryption.', 'High'),
('AC.L2-3.1.18', 'Control Connection of Mobile Devices', 'Control connection of mobile devices.', 'High'),
('AC.L2-3.1.19', 'Encrypt CUI on Mobile Devices', 'Encrypt CUI on mobile devices and mobile computing platforms.', 'High'),
('AC.L2-3.1.20', 'Verify and Control All Connections to External Systems', 'Verify and control/limit connections to external systems.', 'High'),
('AC.L2-3.1.21', 'Limit Use of Portable Storage Devices on External Systems', 'Limit use of portable storage devices on external systems.', 'Medium'),
('AC.L2-3.1.22', 'Control CUI Posted or Processed on Publicly Accessible Systems', 'Control CUI posted or processed on publicly accessible information systems.', 'High'),
-- ... (see seed.ts for full list)
```

- [ ] **Step 4: Write full seed.ts to file** (see Task 3 execution — this is the most critical file)

- [ ] **Step 5: Verify seed compiles**
```bash
cd /Users/gtj105/Documents/obsidian/dashboard && npx tsx --version
```

---

## Task 4: Auth Layer

**Files:**
- Create: `dashboard/src/lib/auth.ts`
- Create: `dashboard/src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create src/lib/auth.ts**

```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import sql from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const [user] = await sql`
          SELECT id, email, password_hash, name FROM users WHERE email = ${credentials.email}
        `
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!valid) return null
        return { id: String(user.id), email: user.email, name: user.name }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
}
```

- [ ] **Step 2: Create API route for NextAuth**

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

---

## Task 5: API Routes

**Files:**
- Create: `src/app/api/overview/route.ts`
- Create: `src/app/api/domains/route.ts`
- Create: `src/app/api/practices/route.ts`
- Create: `src/app/api/practices/[id]/route.ts`
- Create: `src/app/api/burndown/route.ts`
- Create: `src/app/api/risk/route.ts`

- [ ] **Step 1: Create overview route** — returns OverviewStats

```typescript
// GET /api/overview
// Returns: { total, not_started, in_progress, implemented, audit_ready, score_pct,
//            itar_total, itar_implemented, itar_score_pct, last_assessment_date }
```

Query pattern:
```sql
SELECT
  COUNT(*) FILTER (WHERE framework = 'CMMC') AS total,
  COUNT(*) FILTER (WHERE framework = 'CMMC' AND status = 'Not Started') AS not_started,
  COUNT(*) FILTER (WHERE framework = 'CMMC' AND status = 'In Progress') AS in_progress,
  COUNT(*) FILTER (WHERE framework = 'CMMC' AND status = 'Implemented') AS implemented,
  COUNT(*) FILTER (WHERE framework = 'CMMC' AND status = 'Audit Ready') AS audit_ready,
  COUNT(*) FILTER (WHERE framework = 'ITAR') AS itar_total,
  COUNT(*) FILTER (WHERE framework = 'ITAR' AND status IN ('Implemented', 'Audit Ready')) AS itar_implemented,
  MAX(updated_at) AS last_assessment_date
FROM practices
```

- [ ] **Step 2: Create domains route** — returns domains with per-domain stats

```sql
SELECT d.*,
  COUNT(p.id) AS total,
  COUNT(p.id) FILTER (WHERE p.status = 'Implemented') AS implemented,
  COUNT(p.id) FILTER (WHERE p.status = 'Audit Ready') AS audit_ready,
  COUNT(p.id) FILTER (WHERE p.status = 'In Progress') AS in_progress,
  COUNT(p.id) FILTER (WHERE p.status = 'Not Started') AS not_started
FROM domains d
LEFT JOIN practices p ON p.domain_id = d.id
WHERE d.framework = 'CMMC'
GROUP BY d.id ORDER BY d.abbreviation
```

- [ ] **Step 3: Create practices list route** — supports `?domain_id=`, `?framework=`, `?status=`, `?risk_level=`

- [ ] **Step 4: Create practice PATCH route** — updates any combination of: status, evidence_exists, owner, due_date, notes

```typescript
// PATCH /api/practices/[id]
// Body: Partial<{ status, evidence_exists, owner, due_date, notes }>
// Validates status and risk_level against allowed enum values
// Always sets updated_at = NOW()
```

- [ ] **Step 5: Create burndown route** — last 90 days

```sql
-- Simulate burndown: count practices per status per week bucket
-- Since we don't store history, generate from current updated_at
-- Return array of { week: string, open: number, closed: number }
-- "open" = Not Started + In Progress, "closed" = Implemented + Audit Ready
-- Group by date_trunc('week', updated_at) for last 90 days
```

- [ ] **Step 6: Create risk route** — all High + Critical practices across both frameworks

```sql
SELECT p.*, d.name AS domain_name, d.abbreviation
FROM practices p
JOIN domains d ON d.id = p.domain_id
WHERE p.risk_level IN ('High', 'Critical')
ORDER BY
  CASE p.risk_level WHEN 'Critical' THEN 0 WHEN 'High' THEN 1 END,
  p.due_date ASC NULLS LAST
```

---

## Task 6: Layout Components

**Files:**
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/TopNav.tsx`
- Create: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Create globals.css** — dark mode CSS variables

Must define all shadcn CSS vars in `:root` and `.dark`. Default to dark.

Key dark mode values:
```css
:root {
  --background: 224 71% 4%;         /* near-black */
  --foreground: 213 31% 91%;
  --card: 224 71% 6%;
  --card-foreground: 213 31% 91%;
  --muted: 223 47% 11%;
  --muted-foreground: 215.4 16.3% 56.9%;
  --border: 216 34% 17%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 1.2%;
  --secondary: 222.2 47.4% 11.2%;
  --secondary-foreground: 210 40% 98%;
  --accent: 216 34% 17%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 210 40% 98%;
  --ring: 216 34% 17%;
  --radius: 0.5rem;
}
```

Force dark mode by default: `<html class="dark">` in layout.tsx.

- [ ] **Step 2: Create root layout.tsx**

- Server component, wraps in SessionProvider (client boundary), applies dark class
- Reads `ORG_NAME` from env (server-side only)
- Fonts: Inter via next/font

- [ ] **Step 3: Create AppShell.tsx** (client component)

- Uses `useSession` to get user
- Redirect to /login if unauthenticated
- Renders `<Sidebar>` + `<TopNav>` + `{children}`
- Layout: `flex h-screen overflow-hidden`

- [ ] **Step 4: Create Sidebar.tsx** (client component)

Fixed left sidebar, 240px wide. Navigation items:
```
Overview            → /overview
── CMMC Domains ──
AC                  → /domain/1
AT                  → /domain/2
AU                  → /domain/3
CA                  → /domain/4
CM                  → /domain/5
IA                  → /domain/6
IR                  → /domain/7
MA                  → /domain/8
MP                  → /domain/9
PE                  → /domain/10
PS                  → /domain/11
RA                  → /domain/12
SC                  → /domain/13
SI                  → /domain/14
── Compliance ──
ITAR Overlay        → /itar
Risk Tracker        → /risk
```

Uses `usePathname` for active state. Active item: slightly lighter bg + left accent border.

- [ ] **Step 5: Create TopNav.tsx**

Right side: Avatar with initials + dropdown (Sign out). Left: page title derived from route.
Shows last assessment date from `/api/overview` response cached in session.

---

## Task 7: Badge Components

**Files:**
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/RiskBadge.tsx`
- Create: `src/components/FrameworkBadge.tsx`
- Create: `src/lib/utils.ts` (shadcn cn utility)

- [ ] **Step 1: Create utils.ts**

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
```

- [ ] **Step 2: Create StatusBadge.tsx**

```typescript
// Not Started: bg-zinc-800 text-zinc-400
// In Progress: bg-amber-900/40 text-amber-400
// Implemented: bg-blue-900/40 text-blue-400
// Audit Ready: bg-green-900/40 text-green-400
```

- [ ] **Step 3: Create RiskBadge.tsx**

```typescript
// Low: bg-zinc-800 text-zinc-400
// Medium: bg-amber-900/40 text-amber-400
// High: bg-orange-900/40 text-orange-400
// Critical: bg-red-900/40 text-red-400
```

- [ ] **Step 4: Create FrameworkBadge.tsx**

```typescript
// CMMC: bg-blue-900/40 text-blue-400
// ITAR: bg-purple-900/40 text-purple-400
```

---

## Task 8: shadcn UI Components

**Files:** `src/components/ui/` — install via shadcn CLI or manually create

Required shadcn components:
- card, table, badge, progress, button, switch, input, textarea, select, avatar, separator, dropdown-menu, label

- [ ] **Step 1: Install shadcn components**

```bash
cd /Users/gtj105/Documents/obsidian/dashboard
npx shadcn@latest add card table badge progress button switch input textarea select avatar separator dropdown-menu label --yes
```

If not possible in Docker build context, manually write each component using the shadcn source.

---

## Task 9: PracticeTable Component

**Files:**
- Create: `src/components/PracticeTable.tsx`

This is the shared table used on domain pages and ITAR page.

- [ ] **Step 1: Write PracticeTable.tsx** (client component)

Props:
```typescript
interface PracticeTableProps {
  practices: Practice[]
  onStatusChange: (id: number, status: Status) => Promise<void>
  onEvidenceToggle: (id: number, value: boolean) => Promise<void>
  onNotesChange: (id: number, notes: string) => Promise<void>
  onOwnerChange: (id: number, owner: string) => Promise<void>
  onDueDateChange: (id: number, date: string) => Promise<void>
}
```

Columns: practice_id | title | status (Select) | risk (Badge) | owner (Input) | due_date (Input[date]) | evidence (Switch) | notes (Textarea, saves on blur)

All mutations call `PATCH /api/practices/[id]`.

Includes filter bar above table: filter by status (Select), risk_level (Select).

---

## Task 10: Overview Page

**Files:**
- Create: `src/app/overview/page.tsx`

- [ ] **Step 1: Write overview page** (server component fetches data, passes to client charts)

Sections:
1. KPI row: Overall score % + 4 status count cards
2. Domain health grid: 14 cards in 4-col grid, RAG coloring
3. ITAR status summary card
4. Two charts side-by-side: Burndown LineChart + Radar RadarChart

KPI card pattern:
```tsx
<Card>
  <CardHeader><CardTitle>Overall Score</CardTitle></CardHeader>
  <CardContent>
    <div className="text-4xl font-bold text-green-400">{score}%</div>
    <Progress value={score} className="mt-2" />
  </CardContent>
</Card>
```

Domain health card RAG logic:
- Green (≥80% complete): `border-green-500/40 bg-green-900/10`
- Amber (40-79%): `border-amber-500/40 bg-amber-900/10`
- Red (<40%): `border-red-500/40 bg-red-900/10`

Burndown chart:
```tsx
<LineChart data={burndownData}>
  <Line dataKey="open" stroke="#f59e0b" name="Open" />
  <Line dataKey="closed" stroke="#22c55e" name="Closed" />
  <XAxis dataKey="week" />
  <YAxis />
  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
  <Legend />
</LineChart>
```

Radar chart:
```tsx
<RadarChart data={radarData}>
  <PolarGrid stroke="#1e293b" />
  <PolarAngleAxis dataKey="domain" tick={{ fill: '#94a3b8', fontSize: 11 }} />
  <Radar dataKey="pct" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
</RadarChart>
```

---

## Task 11: Domain Detail Page

**Files:**
- Create: `src/app/domain/[id]/page.tsx`

- [ ] **Step 1: Write domain detail page** (server component for data, PracticeTable client component)

Header: domain name, description, completion % + Progress bar
Body: `<PracticeTable>` with all practices for this domain

---

## Task 12: ITAR Overlay Page

**Files:**
- Create: `src/app/itar/page.tsx`

- [ ] **Step 1: Write ITAR page**

Same pattern as domain detail. Groups practices by ITAR category (stored in `domain.name`).
Header: ITAR compliance score, description.
Body: `<PracticeTable>` filtered to framework = 'ITAR'.

---

## Task 13: Risk Tracker Page

**Files:**
- Create: `src/app/risk/page.tsx`

- [ ] **Step 1: Write risk page** (client component with sort/filter)

Fetches from `/api/risk`. Columns: practice_id | framework badge | domain | title | risk badge | owner | due_date | status badge.

Filter bar: framework (Select), domain (Select), status (Select).
Default sort: risk_level (Critical first), then due_date asc.

---

## Task 14: Login Page

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/page.tsx` (root redirect)

- [ ] **Step 1: Create login page** (client component)

Centered card, dark bg:
- Email + Password inputs
- "Sign In" button → calls `signIn('credentials', { email, password, callbackUrl: '/overview' })`
- Error message on failure
- Org name displayed above card from env (pass via layout or server component wrapper)

- [ ] **Step 2: Create root page.tsx**

```typescript
import { redirect } from 'next/navigation'
export default function Home() { redirect('/overview') }
```

---

## Task 15: Final Integration Checks

- [ ] **Step 1: Verify all imports resolve** — no circular deps, all `@/` paths valid
- [ ] **Step 2: Verify seed script produces correct counts**
  - 14 CMMC domains + 1 ITAR domain = 15 domains
  - 110 CMMC practices + 20 ITAR practices = 130 practices total
- [ ] **Step 3: Verify docker compose builds**

```bash
cd /Users/gtj105/Documents/obsidian/dashboard
docker compose build
```

- [ ] **Step 4: Verify docker compose up**

```bash
docker compose up -d
```

- [ ] **Step 5: Seed the database**

```bash
docker compose exec app npm run seed
```

- [ ] **Step 6: Verify login**

Navigate to `http://localhost/login`, sign in with `admin@localhost` / `admin`.

- [ ] **Step 7: Verify overview page loads** with KPI cards, domain grid, charts

- [ ] **Step 8: Verify domain page** — AC domain, toggle an evidence switch, confirm DB update

- [ ] **Step 9: Verify ITAR page** — shows 20 ITAR controls grouped by category

- [ ] **Step 10: Verify risk page** — shows High + Critical practices, sortable

---

## Seed Data: Full ITAR Controls (20 controls)

ITAR domain: `{ name: 'ITAR Compliance', abbreviation: 'ITAR', framework: 'ITAR', description: 'Export Administration Regulations and International Traffic in Arms Regulations compliance controls.' }`

| ID | Category | Title | Risk |
|----|----------|-------|------|
| ITAR-P-001 | Personnel | Screen employees for ITAR-controlled technical data access | High |
| ITAR-P-002 | Personnel | Maintain records of individuals with access to ITAR data | Medium |
| ITAR-P-003 | Personnel | Conduct annual ITAR awareness training | Medium |
| ITAR-P-004 | Personnel | Implement foreign national access restrictions | Critical |
| ITAR-P-005 | Personnel | Document employee ITAR agreements and acknowledgments | Medium |
| ITAR-DR-001 | Data Residency | Ensure ITAR technical data remains within U.S. jurisdiction | Critical |
| ITAR-DR-002 | Data Residency | Restrict cloud storage of ITAR data to U.S.-only services | High |
| ITAR-DR-003 | Data Residency | Document data flows for all ITAR-controlled information | High |
| ITAR-DR-004 | Data Residency | Prevent unauthorized transfer of ITAR data to foreign entities | Critical |
| ITAR-AB-001 | Access Boundary | Implement logical access controls for ITAR-controlled systems | High |
| ITAR-AB-002 | Access Boundary | Segregate ITAR data from non-ITAR systems | High |
| ITAR-AB-003 | Access Boundary | Enforce need-to-know access for ITAR technical data | High |
| ITAR-AB-004 | Access Boundary | Monitor and log all access to ITAR-controlled systems | Medium |
| ITAR-D-001 | Disclosure | Document all ITAR disclosures and export authorizations | High |
| ITAR-D-002 | Disclosure | Obtain required licenses before sharing ITAR data externally | Critical |
| ITAR-D-003 | Disclosure | Maintain records of all ITAR export activities for 5 years | High |
| ITAR-D-004 | Disclosure | Report unauthorized disclosures to DDTC within required timeframes | Critical |
| ITAR-T-001 | Training | Conduct initial ITAR compliance training for all personnel | Medium |
| ITAR-T-002 | Training | Provide role-specific ITAR training for export control officers | High |
| ITAR-T-003 | Training | Track and verify completion of ITAR training requirements | Medium |

---

## Reviewer Clarifications (Added After Review)

- **ITAR count:** Plan table has exactly 20 controls (5+4+4+4+3). Seed.ts must insert exactly 20 — verify count before committing.
- **tailwind.config.ts** already includes `darkMode: ['class']` at line 1 of the config block — no change needed.
- **Seed.ts must contain all 110 CMMC practices** — AC is shown as an example. Executor must write the full list for all 14 domains using the risk heuristic table.
- **ITAR domain_id = 15** — seed domains 1–14 as CMMC, domain 15 as ITAR. All ITAR practices get `domain_id = 15`.
- **SessionProvider wrapper** — must be a separate `src/components/SessionProviderWrapper.tsx` client component (`'use client'`) that wraps `{children}` in `<SessionProvider>`. Import and use in `layout.tsx` (which itself stays a server component).

---

## Notes for Executor

1. **No mock data anywhere** — every page fetches from Postgres via API routes or server components. Do not hardcode practice lists in React.
2. **Dark mode** — set `class="dark"` on `<html>`. Do not use `prefers-color-scheme` media query. Hard default.
3. **API auth check** — all API routes except `/api/auth/*` must start with:
   ```typescript
   const session = await getServerSession(authOptions)
   if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
   ```
   Apply to: overview, domains, practices, practices/[id], burndown, risk routes.
4. **Evidence field** — `evidence_exists boolean DEFAULT false`. The `evidence_url text` column is intentionally NOT created yet (future upgrade path). Do not add it now.
5. **Burndown chart** — since we have no historical data, seed 13 weeks of synthetic burndown data in the seed script by backfilling `updated_at` values across the 110 practices randomly distributed over the past 90 days. This gives a realistic-looking chart on first load.
6. **ORG_NAME** — read from `process.env.ORG_NAME` server-side only. Never expose to client bundle. Pass as a prop from server component → client layout.
7. **Tailscale** — no special config needed. The app binds to 0.0.0.0:80 via nginx, Tailscale handles the rest.
