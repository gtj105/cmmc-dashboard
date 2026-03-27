# Deployment Simplification And Dual Runtime Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard simpler to deploy as a self-contained internal service while preserving a separate instance that can be actively developed without interfering with the stable runtime.

**Architecture:** Split the current mixed deployment story into three explicit modes: a minimal internal runtime, a separate development runtime, and optional ops extras. Standardize all operational actions around container-executed commands and a single bootstrap path so operators do not need a host Node environment to run or recover the system.

**Tech Stack:** Docker Compose, Next.js 14, Node 20, PostgreSQL 15, shell bootstrap scripts, current JSON export/import tooling, current health and audit infrastructure

---

## File Structure And Responsibilities

### Existing files to modify

- `docker-compose.yml`
  - Reduce this to the default internal runtime shape only.
  - Keep only what is truly required for a normal internal deployment.

- `README.md`
  - Replace the current mixed setup story with a clear two-lane operator guide:
    - internal runtime
    - development runtime

- `docs/RUNBOOK.md`
  - Reframe around container-first operations.
  - Remove assumptions that host-side `npm run ...` is the normal ops path.

- `docs/SECURITY-AND-OPERATIONS.md`
  - Update the supported deployment boundary and secret-handling story.

- `package.json`
  - Keep scripts for container use, but align naming with the new wrapper scripts.
  - Add any helper commands needed by bootstrap.

- `scripts/setup-secrets.sh`
  - Make this the one supported secret bootstrap path for internal deployment.
  - Ensure it only manages non-secret config in `.env`.

- `scripts/import-data.ts`
  - Remove schema/bootstrap ownership from import.
  - Make import assume a prepared schema.

- `scripts/export-data.ts`
  - Keep, but ensure it remains safe to call from the app container.

- `scripts/seed.ts`
  - Align with a container-first bootstrap path.
  - Only seed when the DB is empty or when explicitly forced.

### New files to create

- `docker-compose.dev.yml`
  - Development override with separate ports, volumes, and live-reload behavior.

- `docker-compose.ops.yml`
  - Optional ops extras, especially backup sidecar and possibly bundled reverse proxy if retained.

- `scripts/bootstrap.sh`
  - One supported first-run command for the internal runtime.

- `scripts/start-dev.sh`
  - One supported command to start the development instance cleanly.

- `scripts/start-runtime.sh`
  - Start the stable internal runtime without remembering compose flags.

- `scripts/stop-runtime.sh`
  - Stop the stable internal runtime cleanly.

- `scripts/seed-runtime.sh`
  - Wrapper around container-executed seed flow.

- `scripts/create-admin.sh`
  - Wrapper around container-executed user bootstrap.

- `scripts/export-runtime.sh`
  - Wrapper around container-executed export flow.

- `scripts/import-runtime.sh`
  - Wrapper around container-executed import flow.

- `scripts/validate-runtime.sh`
  - Wrapper around container-executed DB validation flow.

- `docs/DEVELOPMENT.md`
  - Developer-only workflow and local iteration instructions.

- `docs/DEPLOYMENT.md`
  - Operator-first internal deployment document.

### Optional follow-up files

- `scripts/migrate.ts` or `scripts/run-migrations.sh`
  - Only if migration execution is not already clearly handled elsewhere.

- `.env.runtime.example`
  - If separating runtime config from dev config materially reduces confusion.

---

## Design Constraints

- Keep the internal runtime simple enough that an operator can stand it up with Docker and one bootstrap command.
- Preserve the current durability work:
  - health checks
  - audit logging
  - secrets handling
  - exports/imports
  - backups
- Do not collapse development and production concerns into one Compose file.
- Do not require host-side Node for normal internal runtime operations.
- Do not introduce a new platform dependency like Supabase or Kubernetes in this plan.
- Prefer wrapper scripts over asking operators to remember long `docker compose exec ...` commands.

---

## Chunk 1: Define The Deployment Modes

### Task 1: Reduce The Base Compose File To The Default Runtime

**Files:**
- Modify: `docker-compose.yml`
- Test: `tests/test_deployment_config.py`
- Test: `tests/test_container_hardening.py`

- [ ] **Step 1: Write or update failing tests for the intended base runtime shape**

Add or extend tests to assert:
- base compose contains only the default runtime services you want to support
- optional services are not required in the base stack
- base runtime still preserves health checks and the current secret model

- [ ] **Step 2: Run the targeted tests to verify they fail for the current compose shape**

Run:

```bash
python3 -m unittest tests.test_deployment_config tests.test_container_hardening -v
```

Expected:
- failures that reflect the current oversized base stack or mismatched deployment assumptions

- [ ] **Step 3: Implement the minimal base compose simplification**

Adjust `docker-compose.yml` so it represents only the normal internal runtime:
- `db`
- `app`
- optionally one proxy if truly required

Do not carry dev-only or optional ops-only services in the base file unless they are absolutely necessary.

- [ ] **Step 4: Run the targeted tests again**

Run:

```bash
python3 -m unittest tests.test_deployment_config tests.test_container_hardening -v
```

Expected:
- PASS

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml tests/test_deployment_config.py tests/test_container_hardening.py
git commit -m "refactor: simplify base deployment compose"
```

### Task 2: Add Explicit Dev And Ops Compose Overlays

**Files:**
- Create: `docker-compose.dev.yml`
- Create: `docker-compose.ops.yml`
- Test: `tests/test_deployment_config.py`

- [ ] **Step 1: Write the failing tests for dev and ops compose overlays**

Add tests that assert:
- dev override uses distinct volumes and ports
- dev override uses a live-reload workflow
- ops override contains optional services like backup

- [ ] **Step 2: Run the targeted test**

Run:

```bash
python3 -m unittest tests.test_deployment_config -v
```

Expected:
- FAIL for missing compose override files or missing expected content

- [ ] **Step 3: Create the minimal compose overlays**

`docker-compose.dev.yml` should include:
- distinct project-facing port
- separate DB/evidence volumes
- source mount for active development
- dev command for Next.js

`docker-compose.ops.yml` should include:
- backup sidecar
- bundled proxy only if still needed as an optional profile

- [ ] **Step 4: Re-run the targeted test**

Run:

```bash
python3 -m unittest tests.test_deployment_config -v
```

Expected:
- PASS

- [ ] **Step 5: Commit**

```bash
git add docker-compose.dev.yml docker-compose.ops.yml tests/test_deployment_config.py
git commit -m "feat: add separate dev and ops compose overlays"
```

---

## Chunk 2: Make Operations Container-First

### Task 3: Add A Single Bootstrap Script For Internal Runtime

**Files:**
- Create: `scripts/bootstrap.sh`
- Modify: `scripts/setup-secrets.sh`
- Modify: `package.json`
- Test: `tests/test_qa_edge_case_tooling.py`

- [ ] **Step 1: Write the failing tests for the bootstrap path**

Add tests that assert:
- `scripts/bootstrap.sh` exists and is executable
- it calls `scripts/setup-secrets.sh`
- it starts the required runtime services
- it runs seed/bootstrap only when required

- [ ] **Step 2: Run the targeted test**

Run:

```bash
python3 -m unittest tests.test_qa_edge_case_tooling -v
```

Expected:
- FAIL because `bootstrap.sh` does not exist yet

- [ ] **Step 3: Implement the bootstrap path**

`scripts/bootstrap.sh` should:
- verify Docker is available
- ensure secrets exist
- ensure `.env` contains only non-secret config needed for runtime
- start `db`
- run migration/bootstrap validation
- seed only when DB is empty
- create default admin only if missing
- start the runtime stack

Keep it idempotent.

- [ ] **Step 4: Re-run the targeted test**

Run:

```bash
python3 -m unittest tests.test_qa_edge_case_tooling -v
```

Expected:
- PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/bootstrap.sh scripts/setup-secrets.sh package.json tests/test_qa_edge_case_tooling.py
git commit -m "feat: add bootstrap path for internal runtime"
```

### Task 4: Replace Host-Side Ops With Wrapper Scripts

**Files:**
- Create: `scripts/start-runtime.sh`
- Create: `scripts/stop-runtime.sh`
- Create: `scripts/start-dev.sh`
- Create: `scripts/seed-runtime.sh`
- Create: `scripts/create-admin.sh`
- Create: `scripts/export-runtime.sh`
- Create: `scripts/import-runtime.sh`
- Create: `scripts/validate-runtime.sh`
- Modify: `README.md`
- Modify: `docs/RUNBOOK.md`
- Test: `tests/test_qa_edge_case_tooling.py`

- [ ] **Step 1: Write failing tests for wrapper script presence and executable state**

Assert each wrapper:
- exists
- is executable
- uses `docker compose exec` or `docker compose run --rm`
- does not require operators to invoke `npm run ...` directly from the host for normal runtime operations

- [ ] **Step 2: Run the targeted test**

Run:

```bash
python3 -m unittest tests.test_qa_edge_case_tooling -v
```

Expected:
- FAIL because the wrapper scripts are missing

- [ ] **Step 3: Implement the wrapper scripts**

Scripts should encapsulate:
- runtime start/stop
- dev start
- seed
- admin creation
- export/import
- validation

Each should be short, explicit, and readable by non-developers.

- [ ] **Step 4: Update docs to use the wrappers**

Update `README.md` and `docs/RUNBOOK.md` so the normal operator path uses the wrapper scripts, not raw host `npm run ...`.

- [ ] **Step 5: Re-run the targeted test**

Run:

```bash
python3 -m unittest tests.test_qa_edge_case_tooling -v
```

Expected:
- PASS

- [ ] **Step 6: Commit**

```bash
git add scripts/start-runtime.sh scripts/stop-runtime.sh scripts/start-dev.sh scripts/seed-runtime.sh scripts/create-admin.sh scripts/export-runtime.sh scripts/import-runtime.sh scripts/validate-runtime.sh README.md docs/RUNBOOK.md tests/test_qa_edge_case_tooling.py
git commit -m "refactor: move runtime operations behind wrapper scripts"
```

---

## Chunk 3: Remove Schema Drift From Import And Bootstrap

### Task 5: Make Import Assume Prepared Schema

**Files:**
- Modify: `scripts/import-data.ts`
- Modify: `scripts/seed.ts`
- Modify: `scripts/validate-db.ts`
- Test: `tests/test_data_transfer_scripts.py`
- Test: `tests/test_data_invariants.py`

- [ ] **Step 1: Write the failing test for import/bootstrap responsibility**

Add or extend tests to assert:
- import no longer creates schema inline
- import fails clearly if schema is not ready
- bootstrap/seed owns schema preparation instead

- [ ] **Step 2: Run the targeted tests**

Run:

```bash
python3 -m unittest tests.test_data_transfer_scripts tests.test_data_invariants -v
```

Expected:
- FAIL if import still contains table-creation behavior or mismatched expectations

- [ ] **Step 3: Implement the minimal responsibility split**

Refactor:
- remove `ensureTables()` from `scripts/import-data.ts`
- use a single migration/bootstrap path before import
- keep import focused on loading a validated payload into an existing schema

- [ ] **Step 4: Re-run the targeted tests**

Run:

```bash
python3 -m unittest tests.test_data_transfer_scripts tests.test_data_invariants -v
```

Expected:
- PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/import-data.ts scripts/seed.ts scripts/validate-db.ts tests/test_data_transfer_scripts.py tests/test_data_invariants.py
git commit -m "refactor: separate schema bootstrap from import flow"
```

---

## Chunk 4: Rewrite The Docs Around The Two-Lane Model

### Task 6: Create Deployment And Development Documents

**Files:**
- Create: `docs/DEPLOYMENT.md`
- Create: `docs/DEVELOPMENT.md`
- Modify: `README.md`
- Modify: `docs/SECURITY-AND-OPERATIONS.md`
- Test: `tests/test_deployment_config.py`

- [ ] **Step 1: Write failing doc-structure assertions**

Add tests that assert:
- `README.md` points to one supported internal runtime flow
- `docs/DEPLOYMENT.md` exists
- `docs/DEVELOPMENT.md` exists
- deployment docs do not reference `.env.local` as the primary runtime path

- [ ] **Step 2: Run the targeted test**

Run:

```bash
python3 -m unittest tests.test_deployment_config -v
```

Expected:
- FAIL on missing docs or outdated setup language

- [ ] **Step 3: Write the docs**

`README.md`
- short product intro
- two supported modes
- link out to deployment and development docs

`docs/DEPLOYMENT.md`
- operator-first
- bootstrap
- start/stop
- backup/restore
- validation

`docs/DEVELOPMENT.md`
- dev compose override
- separate ports and volumes
- reseed and reset workflow
- how to keep dev isolated from runtime

`docs/SECURITY-AND-OPERATIONS.md`
- update to the final supported deployment boundary

- [ ] **Step 4: Re-run the targeted test**

Run:

```bash
python3 -m unittest tests.test_deployment_config -v
```

Expected:
- PASS

- [ ] **Step 5: Commit**

```bash
git add README.md docs/DEPLOYMENT.md docs/DEVELOPMENT.md docs/SECURITY-AND-OPERATIONS.md tests/test_deployment_config.py
git commit -m "docs: consolidate deployment and development guidance"
```

---

## Chunk 5: End-To-End Verification

### Task 7: Verify Internal Runtime And Dev Runtime Both Work

**Files:**
- Verify only

- [ ] **Step 1: Verify static tests**

Run:

```bash
python3 -m unittest tests.test_deployment_config tests.test_data_invariants tests.test_auth_flow_config tests.test_qa_edge_case_tooling -v
```

Expected:
- PASS

- [ ] **Step 2: Verify the DB invariants**

Run:

```bash
bash ./scripts/validate-runtime.sh
```

Expected:
- output equivalent to `All invariants passed.`

- [ ] **Step 3: Verify internal runtime smoke path**

Run:

```bash
bash ./scripts/start-runtime.sh
bash ./scripts/smoke-test.sh
```

Expected:
- smoke test reports all checks passing

- [ ] **Step 4: Verify dev runtime starts separately**

Run:

```bash
bash ./scripts/start-dev.sh
docker compose -p cmmc-dev -f docker-compose.yml -f docker-compose.dev.yml ps
```

Expected:
- dev stack running on its own port
- distinct volumes/services from runtime stack

- [ ] **Step 5: Verify operator docs match actual commands**

Manually compare:
- `README.md`
- `docs/DEPLOYMENT.md`
- `docs/DEVELOPMENT.md`

Expected:
- no commands that require host Node for normal runtime operations
- no conflicting `.env.local` deployment path

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: verify simplified deployment and dual-runtime workflow"
```

---

## Rollout Notes

- Keep backward compatibility for one release where possible:
  - do not immediately delete existing package scripts
  - instead, shift docs and wrappers first
- Do not remove backup functionality; move it behind the ops overlay unless there is a strong reason to keep it always-on
- Prefer `127.0.0.1` in smoke and runtime probes where local `localhost` resolution has already proven fragile
- Preserve the current stable admin defaults unless there is a coordinated password bootstrap change

## Review Checklist

- Is the base runtime truly minimal?
- Can an operator deploy with Docker only?
- Can a developer run a live dev instance beside the stable runtime?
- Are secrets configured in one clear way?
- Are import/bootstrap responsibilities no longer duplicated?
- Do docs describe exactly one supported runtime path?

## Success Criteria

- Internal runtime can be brought up with one bootstrap command and Docker only
- Dev runtime can run separately without sharing the runtime DB/evidence volumes
- Runtime operations do not require host-side `npm run ...`
- Deployment docs are consistent
- Health, validation, and smoke checks still pass

