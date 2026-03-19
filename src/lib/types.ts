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
