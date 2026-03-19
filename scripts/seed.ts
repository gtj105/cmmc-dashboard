import postgres from 'postgres'
import bcrypt from 'bcryptjs'

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) throw new Error('DATABASE_URL environment variable is required')
const sql = postgres(dbUrl)

async function seed() {
  console.log('Creating tables...')

  await sql`
    CREATE TABLE IF NOT EXISTS domains (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      abbreviation TEXT NOT NULL,
      framework TEXT NOT NULL DEFAULT 'CMMC',
      description TEXT NOT NULL DEFAULT ''
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS practices (
      id SERIAL PRIMARY KEY,
      domain_id INTEGER NOT NULL REFERENCES domains(id),
      framework TEXT NOT NULL DEFAULT 'CMMC',
      practice_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Not Started',
      risk_level TEXT NOT NULL DEFAULT 'Medium',
      owner TEXT,
      due_date DATE,
      evidence_exists BOOLEAN NOT NULL DEFAULT false,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  // Clear existing data for idempotent re-runs
  console.log('Clearing existing data...')
  await sql`TRUNCATE practices, domains, users RESTART IDENTITY CASCADE`

  // ── Domains (14 CMMC + 1 ITAR = 15 total) ──
  console.log('Inserting domains...')
  const domains = [
    { id: 1,  name: 'Access Control',                      abbreviation: 'AC',   framework: 'CMMC', description: '' },
    { id: 2,  name: 'Awareness and Training',              abbreviation: 'AT',   framework: 'CMMC', description: '' },
    { id: 3,  name: 'Audit and Accountability',            abbreviation: 'AU',   framework: 'CMMC', description: '' },
    { id: 4,  name: 'Security Assessment',                 abbreviation: 'CA',   framework: 'CMMC', description: '' },
    { id: 5,  name: 'Configuration Management',            abbreviation: 'CM',   framework: 'CMMC', description: '' },
    { id: 6,  name: 'Identification and Authentication',   abbreviation: 'IA',   framework: 'CMMC', description: '' },
    { id: 7,  name: 'Incident Response',                   abbreviation: 'IR',   framework: 'CMMC', description: '' },
    { id: 8,  name: 'Maintenance',                         abbreviation: 'MA',   framework: 'CMMC', description: '' },
    { id: 9,  name: 'Media Protection',                    abbreviation: 'MP',   framework: 'CMMC', description: '' },
    { id: 10, name: 'Physical Protection',                 abbreviation: 'PE',   framework: 'CMMC', description: '' },
    { id: 11, name: 'Personnel Security',                  abbreviation: 'PS',   framework: 'CMMC', description: '' },
    { id: 12, name: 'Risk Assessment',                     abbreviation: 'RA',   framework: 'CMMC', description: '' },
    { id: 13, name: 'System and Communications Protection', abbreviation: 'SC',  framework: 'CMMC', description: '' },
    { id: 14, name: 'System and Information Integrity',    abbreviation: 'SI',   framework: 'CMMC', description: '' },
    { id: 15, name: 'ITAR Compliance',                     abbreviation: 'ITAR', framework: 'ITAR', description: '' },
  ]

  for (const d of domains) {
    await sql`
      INSERT INTO domains (id, name, abbreviation, framework, description)
      VALUES (${d.id}, ${d.name}, ${d.abbreviation}, ${d.framework}, ${d.description})
    `
  }
  // Reset sequence after explicit id inserts
  await sql`SELECT setval('domains_id_seq', 15)`

  // ── 110 CMMC Practices ──
  console.log('Inserting 110 CMMC practices...')

  const cmmcPractices: { domain_id: number; practice_id: string; title: string; risk_level: string }[] = [
    // AC domain (id=1) — 22 practices
    { domain_id: 1, practice_id: 'AC.L2-3.1.1',  title: 'Limit System Access to Authorized Users', risk_level: 'High' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.2',  title: 'Limit System Access to Types of Transactions and Functions', risk_level: 'High' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.3',  title: 'Control CUI Flow', risk_level: 'High' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.4',  title: 'Separate Duties of Individuals', risk_level: 'High' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.5',  title: 'Employ Least Privilege', risk_level: 'High' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.6',  title: 'Use Non-Privileged Accounts or Roles', risk_level: 'Medium' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.7',  title: 'Prevent Non-Privileged Users from Executing Privileged Functions', risk_level: 'High' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.8',  title: 'Limit Unsuccessful Logon Attempts', risk_level: 'Medium' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.9',  title: 'Provide Privacy and Security Notices', risk_level: 'Low' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.10', title: 'Use Session Lock', risk_level: 'Medium' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.11', title: 'Terminate Sessions', risk_level: 'Medium' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.12', title: 'Monitor and Control Remote Access Sessions', risk_level: 'High' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.13', title: 'Employ Cryptographic Mechanisms to Protect CUI During Transmission', risk_level: 'High' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.14', title: 'Route Remote Access via Managed Access Control Points', risk_level: 'High' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.15', title: 'Authorize Remote Execution of Privileged Commands', risk_level: 'High' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.16', title: 'Authorize Wireless Access', risk_level: 'High' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.17', title: 'Protect Wireless Access Using Authentication and Encryption', risk_level: 'High' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.18', title: 'Control Connection of Mobile Devices', risk_level: 'High' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.19', title: 'Encrypt CUI on Mobile Devices', risk_level: 'High' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.20', title: 'Verify and Control All Connections to External Systems', risk_level: 'High' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.21', title: 'Limit Use of Portable Storage Devices on External Systems', risk_level: 'Medium' },
    { domain_id: 1, practice_id: 'AC.L2-3.1.22', title: 'Control CUI Posted or Processed on Publicly Accessible Systems', risk_level: 'High' },

    // AT domain (id=2) — 3 practices
    { domain_id: 2, practice_id: 'AT.L2-3.2.1', title: 'Ensure Personnel Awareness', risk_level: 'Medium' },
    { domain_id: 2, practice_id: 'AT.L2-3.2.2', title: 'Ensure Personnel Training', risk_level: 'Medium' },
    { domain_id: 2, practice_id: 'AT.L2-3.2.3', title: 'Provide Security Awareness Training on Recognizing and Reporting Threats', risk_level: 'Medium' },

    // AU domain (id=3) — 9 practices
    { domain_id: 3, practice_id: 'AU.L2-3.3.1', title: 'Create and Retain System Audit Logs', risk_level: 'High' },
    { domain_id: 3, practice_id: 'AU.L2-3.3.2', title: 'Ensure User Accountability via Audit Logs', risk_level: 'High' },
    { domain_id: 3, practice_id: 'AU.L2-3.3.3', title: 'Review and Update Logged Events', risk_level: 'Medium' },
    { domain_id: 3, practice_id: 'AU.L2-3.3.4', title: 'Alert in the Event of Audit Process Failure', risk_level: 'Medium' },
    { domain_id: 3, practice_id: 'AU.L2-3.3.5', title: 'Correlate Audit Record Review, Analysis, and Reporting', risk_level: 'Medium' },
    { domain_id: 3, practice_id: 'AU.L2-3.3.6', title: 'Provide Audit Record Reduction and Report Generation', risk_level: 'Medium' },
    { domain_id: 3, practice_id: 'AU.L2-3.3.7', title: 'Provide System Capability Supporting Audit Reduction', risk_level: 'Medium' },
    { domain_id: 3, practice_id: 'AU.L2-3.3.8', title: 'Protect Audit Information and Tools', risk_level: 'Medium' },
    { domain_id: 3, practice_id: 'AU.L2-3.3.9', title: 'Limit Management of Audit Logging to Subset of Privileged Users', risk_level: 'Medium' },

    // CA domain (id=4) — 4 practices
    { domain_id: 4, practice_id: 'CA.L2-3.12.1', title: 'Periodically Assess Security Controls', risk_level: 'Medium' },
    { domain_id: 4, practice_id: 'CA.L2-3.12.2', title: 'Develop and Implement Plans of Action', risk_level: 'Medium' },
    { domain_id: 4, practice_id: 'CA.L2-3.12.3', title: 'Monitor Security Controls on an Ongoing Basis', risk_level: 'Medium' },
    { domain_id: 4, practice_id: 'CA.L2-3.12.4', title: 'Develop, Document, and Periodically Update System Security Plans', risk_level: 'Medium' },

    // CM domain (id=5) — 9 practices
    { domain_id: 5, practice_id: 'CM.L2-3.4.1', title: 'Establish Configuration Baselines', risk_level: 'High' },
    { domain_id: 5, practice_id: 'CM.L2-3.4.2', title: 'Establish and Enforce Security Configuration Settings', risk_level: 'High' },
    { domain_id: 5, practice_id: 'CM.L2-3.4.3', title: 'Track, Review, Approve, and Log Changes to Systems', risk_level: 'Medium' },
    { domain_id: 5, practice_id: 'CM.L2-3.4.4', title: 'Analyze Security Impact of Changes Prior to Implementation', risk_level: 'Medium' },
    { domain_id: 5, practice_id: 'CM.L2-3.4.5', title: 'Define, Document, Approve, and Enforce Physical and Logical Access Restrictions', risk_level: 'Medium' },
    { domain_id: 5, practice_id: 'CM.L2-3.4.6', title: 'Employ Principle of Least Functionality', risk_level: 'Medium' },
    { domain_id: 5, practice_id: 'CM.L2-3.4.7', title: 'Restrict, Disable, or Prevent the Use of Nonessential Programs', risk_level: 'Medium' },
    { domain_id: 5, practice_id: 'CM.L2-3.4.8', title: 'Apply Deny-by-Exception Policy to Prevent Use of Unauthorized Software', risk_level: 'Medium' },
    { domain_id: 5, practice_id: 'CM.L2-3.4.9', title: 'Control and Monitor User-Installed Software', risk_level: 'Medium' },

    // IA domain (id=6) — 11 practices
    { domain_id: 6, practice_id: 'IA.L2-3.5.1',  title: 'Identify System Users, Processes, and Devices', risk_level: 'Medium' },
    { domain_id: 6, practice_id: 'IA.L2-3.5.2',  title: 'Authenticate Users, Processes, and Devices', risk_level: 'Medium' },
    { domain_id: 6, practice_id: 'IA.L2-3.5.3',  title: 'Use Multifactor Authentication for Local and Network Access', risk_level: 'Critical' },
    { domain_id: 6, practice_id: 'IA.L2-3.5.4',  title: 'Employ Replay-Resistant Authentication Mechanisms', risk_level: 'High' },
    { domain_id: 6, practice_id: 'IA.L2-3.5.5',  title: 'Employ Identifier Management', risk_level: 'Medium' },
    { domain_id: 6, practice_id: 'IA.L2-3.5.6',  title: 'Employ Authentication Management', risk_level: 'Medium' },
    { domain_id: 6, practice_id: 'IA.L2-3.5.7',  title: 'Enforce Minimum Password Complexity and Change Requirements', risk_level: 'High' },
    { domain_id: 6, practice_id: 'IA.L2-3.5.8',  title: 'Prohibit Password Reuse', risk_level: 'High' },
    { domain_id: 6, practice_id: 'IA.L2-3.5.9',  title: 'Allow Temporary Password Use with Immediate Change Requirement', risk_level: 'Medium' },
    { domain_id: 6, practice_id: 'IA.L2-3.5.10', title: 'Store and Transmit Only Cryptographically Protected Passwords', risk_level: 'High' },
    { domain_id: 6, practice_id: 'IA.L2-3.5.11', title: 'Obscure Feedback of Authentication Information', risk_level: 'Medium' },

    // IR domain (id=7) — 3 practices
    { domain_id: 7, practice_id: 'IR.L2-3.6.1', title: 'Establish an Operational Incident-Handling Capability', risk_level: 'High' },
    { domain_id: 7, practice_id: 'IR.L2-3.6.2', title: 'Track, Document, and Report Incidents', risk_level: 'High' },
    { domain_id: 7, practice_id: 'IR.L2-3.6.3', title: 'Test Incident Response Capability', risk_level: 'High' },

    // MA domain (id=8) — 6 practices
    { domain_id: 8, practice_id: 'MA.L2-3.7.1', title: 'Perform Maintenance on Organizational Systems', risk_level: 'Medium' },
    { domain_id: 8, practice_id: 'MA.L2-3.7.2', title: 'Provide Controls on the Tools, Techniques, Mechanisms, and Personnel for Maintenance', risk_level: 'Medium' },
    { domain_id: 8, practice_id: 'MA.L2-3.7.3', title: 'Ensure Equipment Removed for Maintenance is Sanitized', risk_level: 'Medium' },
    { domain_id: 8, practice_id: 'MA.L2-3.7.4', title: 'Check Media Containing Diagnostic and Test Programs for Malicious Code', risk_level: 'Medium' },
    { domain_id: 8, practice_id: 'MA.L2-3.7.5', title: 'Require MFA for Remote Maintenance Sessions', risk_level: 'Critical' },
    { domain_id: 8, practice_id: 'MA.L2-3.7.6', title: 'Supervise Maintenance Activities of Personnel Without Required Access Authorization', risk_level: 'Medium' },

    // MP domain (id=9) — 9 practices
    { domain_id: 9, practice_id: 'MP.L2-3.8.1', title: 'Protect System Media Containing CUI', risk_level: 'Medium' },
    { domain_id: 9, practice_id: 'MP.L2-3.8.2', title: 'Limit Access to CUI on System Media', risk_level: 'Medium' },
    { domain_id: 9, practice_id: 'MP.L2-3.8.3', title: 'Sanitize or Destroy System Media Before Disposal or Reuse', risk_level: 'High' },
    { domain_id: 9, practice_id: 'MP.L2-3.8.4', title: 'Mark Media with Necessary CUI Markings and Distribution Limitations', risk_level: 'Medium' },
    { domain_id: 9, practice_id: 'MP.L2-3.8.5', title: 'Control Access to Media Containing CUI', risk_level: 'Medium' },
    { domain_id: 9, practice_id: 'MP.L2-3.8.6', title: 'Implement Cryptographic Mechanisms to Protect CUI During Transport', risk_level: 'High' },
    { domain_id: 9, practice_id: 'MP.L2-3.8.7', title: 'Control the Use of Removable Media on System Components', risk_level: 'Medium' },
    { domain_id: 9, practice_id: 'MP.L2-3.8.8', title: 'Prohibit the Use of Portable Storage Without Identifiable Owner', risk_level: 'Medium' },
    { domain_id: 9, practice_id: 'MP.L2-3.8.9', title: 'Protect Backups of CUI', risk_level: 'High' },

    // PE domain (id=10) — 6 practices
    { domain_id: 10, practice_id: 'PE.L2-3.10.1', title: 'Limit Physical Access to Organizational Systems', risk_level: 'Medium' },
    { domain_id: 10, practice_id: 'PE.L2-3.10.2', title: 'Protect and Monitor the Physical Facility and Support Infrastructure', risk_level: 'Medium' },
    { domain_id: 10, practice_id: 'PE.L2-3.10.3', title: 'Escort Visitors and Monitor Visitor Activity', risk_level: 'Medium' },
    { domain_id: 10, practice_id: 'PE.L2-3.10.4', title: 'Maintain Audit Logs of Physical Access', risk_level: 'Medium' },
    { domain_id: 10, practice_id: 'PE.L2-3.10.5', title: 'Control and Manage Physical Access Devices', risk_level: 'Medium' },
    { domain_id: 10, practice_id: 'PE.L2-3.10.6', title: 'Enforce Safeguarding Measures for CUI at Alternate Work Sites', risk_level: 'Medium' },

    // PS domain (id=11) — 2 practices
    { domain_id: 11, practice_id: 'PS.L2-3.9.1', title: 'Screen Individuals Prior to Authorizing Access to Systems', risk_level: 'Medium' },
    { domain_id: 11, practice_id: 'PS.L2-3.9.2', title: 'Ensure CUI is Protected During and After Personnel Actions', risk_level: 'High' },

    // RA domain (id=12) — 3 practices
    { domain_id: 12, practice_id: 'RA.L2-3.11.1', title: 'Periodically Assess Risk to Organizational Operations, Assets, and Individuals', risk_level: 'Medium' },
    { domain_id: 12, practice_id: 'RA.L2-3.11.2', title: 'Scan for Vulnerabilities in Organizational Systems and Applications Periodically', risk_level: 'High' },
    { domain_id: 12, practice_id: 'RA.L2-3.11.3', title: 'Remediate Vulnerabilities in Accordance with Risk Assessments', risk_level: 'High' },

    // SC domain (id=13) — 16 practices
    { domain_id: 13, practice_id: 'SC.L2-3.13.1',  title: 'Monitor, Control, and Protect Communications at External Boundaries', risk_level: 'High' },
    { domain_id: 13, practice_id: 'SC.L2-3.13.2',  title: 'Employ Architectural Designs, Software Development Techniques, and Systems Engineering Principles', risk_level: 'High' },
    { domain_id: 13, practice_id: 'SC.L2-3.13.3',  title: 'Separate User Functionality from System Management Functionality', risk_level: 'High' },
    { domain_id: 13, practice_id: 'SC.L2-3.13.4',  title: 'Prevent Unauthorized and Unintended Information Transfer', risk_level: 'High' },
    { domain_id: 13, practice_id: 'SC.L2-3.13.5',  title: 'Implement Subnetworks for Publicly Accessible System Components', risk_level: 'High' },
    { domain_id: 13, practice_id: 'SC.L2-3.13.6',  title: 'Deny Network Communications Traffic by Default', risk_level: 'High' },
    { domain_id: 13, practice_id: 'SC.L2-3.13.7',  title: 'Prevent Remote Devices from Simultaneously Using Non-Remote Connections', risk_level: 'High' },
    { domain_id: 13, practice_id: 'SC.L2-3.13.8',  title: 'Implement Cryptographic Mechanisms to Prevent Unauthorized Disclosure of CUI', risk_level: 'Critical' },
    { domain_id: 13, practice_id: 'SC.L2-3.13.9',  title: 'Terminate Network Connections After Defined Period of Inactivity', risk_level: 'High' },
    { domain_id: 13, practice_id: 'SC.L2-3.13.10', title: 'Establish and Manage Cryptographic Keys', risk_level: 'High' },
    { domain_id: 13, practice_id: 'SC.L2-3.13.11', title: 'Employ FIPS-Validated Cryptography When Used to Protect CUI', risk_level: 'Critical' },
    { domain_id: 13, practice_id: 'SC.L2-3.13.12', title: 'Prohibit Remote Activation of Collaborative Computing Devices', risk_level: 'High' },
    { domain_id: 13, practice_id: 'SC.L2-3.13.13', title: 'Control and Monitor the Use of Mobile Code', risk_level: 'High' },
    { domain_id: 13, practice_id: 'SC.L2-3.13.14', title: 'Control and Monitor the Use of VoIP Technologies', risk_level: 'Medium' },
    { domain_id: 13, practice_id: 'SC.L2-3.13.15', title: 'Protect the Authenticity of Communications Sessions', risk_level: 'High' },
    { domain_id: 13, practice_id: 'SC.L2-3.13.16', title: 'Protect CUI at Rest', risk_level: 'Critical' },

    // SI domain (id=14) — 7 practices
    { domain_id: 14, practice_id: 'SI.L2-3.14.1', title: 'Identify, Report, and Correct System Flaws', risk_level: 'Medium' },
    { domain_id: 14, practice_id: 'SI.L2-3.14.2', title: 'Provide Protection from Malicious Code at Appropriate Locations', risk_level: 'High' },
    { domain_id: 14, practice_id: 'SI.L2-3.14.3', title: 'Monitor System Security Alerts and Advisories', risk_level: 'High' },
    { domain_id: 14, practice_id: 'SI.L2-3.14.4', title: 'Update Malicious Code Protection Mechanisms', risk_level: 'High' },
    { domain_id: 14, practice_id: 'SI.L2-3.14.5', title: 'Perform Periodic Scans of Systems and Real-Time Scans of Files from External Sources', risk_level: 'High' },
    { domain_id: 14, practice_id: 'SI.L2-3.14.6', title: 'Monitor Systems to Detect Attacks and Indicators of Potential Attacks', risk_level: 'High' },
    { domain_id: 14, practice_id: 'SI.L2-3.14.7', title: 'Identify Unauthorized Use of Systems', risk_level: 'High' },
  ]

  // Verify count before insert
  console.log(`CMMC practices to insert: ${cmmcPractices.length}`)
  if (cmmcPractices.length !== 110) {
    throw new Error(`Expected 110 CMMC practices, got ${cmmcPractices.length}`)
  }

  for (const p of cmmcPractices) {
    await sql`
      INSERT INTO practices (domain_id, framework, practice_id, title, description, status, risk_level)
      VALUES (${p.domain_id}, 'CMMC', ${p.practice_id}, ${p.title}, '', 'Not Started', ${p.risk_level})
    `
  }

  // ── 20 ITAR Controls ──
  console.log('Inserting 20 ITAR controls...')

  const itarControls: { practice_id: string; title: string; description: string; risk_level: string }[] = [
    // Personnel (ITAR-P) — 5
    { practice_id: 'ITAR-P-001', title: 'Screen Employees for ITAR-Controlled Data Access', description: 'Verify employees are U.S. Persons prior to granting access to ITAR-controlled technical data.', risk_level: 'High' },
    { practice_id: 'ITAR-P-002', title: 'Maintain Records of ITAR Data Access', description: 'Keep current records of all individuals with access to ITAR-controlled data, including role and access date.', risk_level: 'Medium' },
    { practice_id: 'ITAR-P-003', title: 'Conduct Annual ITAR Awareness Training', description: 'Provide annual ITAR compliance awareness training to all personnel with access to ITAR data.', risk_level: 'Medium' },
    { practice_id: 'ITAR-P-004', title: 'Implement Foreign National Access Restrictions', description: 'Restrict access to ITAR-controlled technical data from foreign nationals without appropriate export authorization.', risk_level: 'Critical' },
    { practice_id: 'ITAR-P-005', title: 'Document Employee ITAR Agreements', description: 'Obtain and retain signed ITAR compliance agreements from all personnel with ITAR data access.', risk_level: 'Medium' },

    // Data Residency (ITAR-DR) — 4
    { practice_id: 'ITAR-DR-001', title: 'Ensure ITAR Data Remains in U.S. Jurisdiction', description: 'Confirm that all ITAR-controlled technical data is stored, processed, and transmitted within U.S. jurisdiction.', risk_level: 'Critical' },
    { practice_id: 'ITAR-DR-002', title: 'Restrict Cloud Storage to U.S.-Only Services', description: 'Use only FedRAMP-authorized or U.S.-jurisdiction cloud services for storing ITAR-controlled information.', risk_level: 'High' },
    { practice_id: 'ITAR-DR-003', title: 'Document ITAR Data Flows', description: 'Maintain documented data flow diagrams for all ITAR-controlled information throughout its lifecycle.', risk_level: 'High' },
    { practice_id: 'ITAR-DR-004', title: 'Prevent Unauthorized Transfer to Foreign Entities', description: 'Implement technical and administrative controls to prevent unauthorized transfer of ITAR data to foreign persons or entities.', risk_level: 'Critical' },

    // Access-Based (ITAR-AB) — 4
    { practice_id: 'ITAR-AB-001', title: 'Implement Logical Access Controls for ITAR Systems', description: 'Deploy role-based access controls limiting ITAR system access to authorized U.S. Persons only.', risk_level: 'High' },
    { practice_id: 'ITAR-AB-002', title: 'Segregate ITAR Data from Non-ITAR Systems', description: 'Maintain logical or physical separation between ITAR-controlled data and non-ITAR information systems.', risk_level: 'High' },
    { practice_id: 'ITAR-AB-003', title: 'Enforce Need-to-Know for ITAR Data', description: 'Apply need-to-know access principles to ensure personnel only access ITAR data required for their role.', risk_level: 'High' },
    { practice_id: 'ITAR-AB-004', title: 'Monitor and Log ITAR System Access', description: 'Implement audit logging for all access to ITAR-controlled systems and review logs regularly.', risk_level: 'Medium' },

    // Disclosure (ITAR-D) — 4
    { practice_id: 'ITAR-D-001', title: 'Document ITAR Disclosures and Export Authorizations', description: 'Maintain records of all ITAR disclosures, export licenses, and authorizations.', risk_level: 'High' },
    { practice_id: 'ITAR-D-002', title: 'Obtain Required Licenses Before External Sharing', description: 'Verify that required ITAR export licenses or exemptions are in place before sharing ITAR data with any external party.', risk_level: 'Critical' },
    { practice_id: 'ITAR-D-003', title: 'Maintain ITAR Export Activity Records for 5 Years', description: 'Retain records of all ITAR export activities, licenses, and authorizations for a minimum of 5 years.', risk_level: 'High' },
    { practice_id: 'ITAR-D-004', title: 'Report Unauthorized Disclosures to DDTC', description: 'Establish and follow procedures to report any unauthorized disclosure of ITAR-controlled data to the Directorate of Defense Trade Controls.', risk_level: 'Critical' },

    // Training (ITAR-T) — 3
    { practice_id: 'ITAR-T-001', title: 'Conduct Initial ITAR Compliance Training', description: 'Provide initial ITAR compliance training to all new personnel before granting access to ITAR-controlled data.', risk_level: 'Medium' },
    { practice_id: 'ITAR-T-002', title: 'Provide Role-Specific Training for Export Control Officers', description: 'Deliver advanced ITAR training to Empowered Officials and export control officers covering licensing, violations, and reporting.', risk_level: 'High' },
    { practice_id: 'ITAR-T-003', title: 'Track and Verify ITAR Training Completion', description: 'Maintain training records and verify completion of ITAR training requirements for all personnel.', risk_level: 'Medium' },
  ]

  // Verify count before insert
  console.log(`ITAR controls to insert: ${itarControls.length}`)
  if (itarControls.length !== 20) {
    throw new Error(`Expected 20 ITAR controls, got ${itarControls.length}`)
  }

  for (const p of itarControls) {
    await sql`
      INSERT INTO practices (domain_id, framework, practice_id, title, description, status, risk_level)
      VALUES (15, 'ITAR', ${p.practice_id}, ${p.title}, ${p.description}, 'Not Started', ${p.risk_level})
    `
  }

  // ── Backfill random updated_at for burndown chart ──
  console.log('Backfilling updated_at for burndown chart...')
  await sql`
    UPDATE practices
    SET updated_at = NOW() - (floor(random() * 91)::int || ' days')::interval
  `

  // ── Admin user ──
  console.log('Creating admin user...')
  const passwordHash = await bcrypt.hash('admin', 10)
  await sql`
    INSERT INTO users (email, password_hash, name)
    VALUES ('admin@localhost', ${passwordHash}, 'Admin')
  `

  // ── Verify counts ──
  const [cmmcCount] = await sql`SELECT COUNT(*)::int as count FROM practices WHERE framework = 'CMMC'`
  const [itarCount] = await sql`SELECT COUNT(*)::int as count FROM practices WHERE framework = 'ITAR'`
  const [domainCount] = await sql`SELECT COUNT(*)::int as count FROM domains`

  console.log(`Domains: ${domainCount.count} (expected 15)`)
  console.log(`CMMC practices: ${cmmcCount.count} (expected 110)`)
  console.log(`ITAR controls: ${itarCount.count} (expected 20)`)

  if (cmmcCount.count !== 110) throw new Error(`CMMC count mismatch: ${cmmcCount.count}`)
  if (itarCount.count !== 20) throw new Error(`ITAR count mismatch: ${itarCount.count}`)
  if (domainCount.count !== 15) throw new Error(`Domain count mismatch: ${domainCount.count}`)

  await sql.end()
  console.log('Seed complete')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
