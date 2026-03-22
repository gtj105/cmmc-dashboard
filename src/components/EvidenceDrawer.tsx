'use client'

import { useEffect, useRef, useState } from 'react'
import type { EvidenceItem } from '@/lib/types'

interface EvidenceDrawerProps {
  practiceId: string | null
  practiceTitle: string
  canEdit: boolean
  onClose: () => void
  onCountChange: (practiceId: string, delta: number) => void
}

export function EvidenceDrawer({
  practiceId,
  practiceTitle,
  canEdit,
  onClose,
  onCountChange,
}: EvidenceDrawerProps) {
  const [items, setItems] = useState<EvidenceItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file')
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!practiceId) { setItems([]); return }
    let active = true
    setLoading(true)
    setError(null)
    fetch(`/api/practices/${practiceId}/evidence`)
      .then((r) => r.json())
      .then((data: EvidenceItem[]) => { if (active) { setItems(data); setLoading(false) } })
      .catch(() => { if (active) { setError('Failed to load evidence'); setLoading(false) } })
    return () => { active = false }
  }, [practiceId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleAddUrl(e: React.FormEvent) {
    e.preventDefault()
    if (!practiceId || !label.trim() || !url.trim()) return
    setUploading(true); setError(null)
    const res = await fetch(`/api/practices/${practiceId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label.trim(), url: url.trim() }),
    })
    if (res.ok) {
      const item: EvidenceItem = await res.json()
      setItems((prev) => [...prev, item])
      onCountChange(practiceId, 1)
      setLabel(''); setUrl('')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to add link')
    }
    setUploading(false)
  }

  async function handleAddFile(e: React.FormEvent) {
    e.preventDefault()
    if (!practiceId || !label.trim() || !fileInputRef.current?.files?.[0]) return
    const file = fileInputRef.current.files[0]
    setUploading(true); setError(null)
    const formData = new FormData()
    formData.append('label', label.trim())
    formData.append('file', file)
    const res = await fetch(`/api/practices/${practiceId}/evidence`, {
      method: 'POST',
      body: formData,
    })
    if (res.ok) {
      const item: EvidenceItem = await res.json()
      setItems((prev) => [...prev, item])
      onCountChange(practiceId, 1)
      setLabel('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to upload file')
    }
    setUploading(false)
  }

  async function handleDelete(id: number) {
    if (!practiceId) return
    const res = await fetch(`/api/practices/${practiceId}/evidence/${id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      setItems((prev) => prev.filter((item) => item.id !== id))
      onCountChange(practiceId, -1)
    }
  }

  if (!practiceId) return null

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l border-sky-500/30 bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border px-4 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Evidence</p>
          <p className="mt-1 font-mono text-xs font-semibold text-sky-300">{practiceId}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{practiceTitle}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-lg leading-none text-muted-foreground hover:text-foreground"
          aria-label="Close evidence drawer"
        >
          ×
        </button>
      </div>

      {/* Evidence list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pb-1 pt-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Attached ({items.length})
          </p>
        </div>
        {loading && <p className="px-4 py-2 text-xs text-muted-foreground">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="px-4 py-2 text-xs text-muted-foreground">No evidence attached yet.</p>
        )}
        <div className="px-4 pb-2 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between border border-border/60 bg-card/30 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                {item.file_path && (
                  <a
                    href={`/api/evidence/${item.file_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block truncate text-[10px] text-sky-300 hover:text-sky-200"
                  >
                    📄 {item.file_path.split('/').pop()}
                  </a>
                )}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block truncate text-[10px] text-sky-300 hover:text-sky-200"
                  >
                    🔗 {item.url}
                  </a>
                )}
                <p className="mt-1 text-[10px] text-muted-foreground/60">
                  {item.uploaded_by} ·{' '}
                  {new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {canEdit && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="ml-2 text-muted-foreground hover:text-red-300"
                  title="Delete evidence"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add evidence form */}
      {canEdit && (
        <div className="border-t border-border px-4 py-4">
          <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Add evidence
          </p>
          <input
            type="text"
            placeholder="Label (required)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mb-3 w-full border border-border/70 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="mb-3 flex border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`pb-2 pr-4 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                activeTab === 'file'
                  ? 'border-b-2 border-sky-400 text-sky-300'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`pb-2 px-4 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                activeTab === 'url'
                  ? 'border-b-2 border-sky-400 text-sky-300'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              URL
            </button>
          </div>
          {activeTab === 'file' ? (
            <form onSubmit={handleAddFile}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.docx,.xlsx,.csv,.txt,.zip"
                className="mb-3 w-full text-xs text-muted-foreground file:mr-3 file:border file:border-border/70 file:bg-card/40 file:px-2 file:py-1 file:text-xs file:text-foreground"
              />
              <button
                type="submit"
                disabled={uploading}
                className="w-full border border-border/70 bg-card/40 py-2 text-xs text-foreground hover:bg-card/60 disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Upload file'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAddUrl}>
              <input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mb-3 w-full border border-border/70 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={uploading}
                className="w-full border border-border/70 bg-card/40 py-2 text-xs text-foreground hover:bg-card/60 disabled:opacity-50"
              >
                {uploading ? 'Saving…' : 'Add link'}
              </button>
            </form>
          )}
          {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        </div>
      )}
    </div>
  )
}
