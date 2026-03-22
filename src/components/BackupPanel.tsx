'use client'

import { useRef, useState } from 'react'

type Phase = 'idle' | 'confirm' | 'working' | 'done' | 'error'

export default function BackupPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importPhase, setImportPhase] = useState<Phase>('idle')
  const [importError, setImportError] = useState<string | null>(null)
  const [exportWorking, setExportWorking] = useState(false)

  async function handleExport() {
    setExportWorking(true)
    try {
      const res = await fetch('/api/admin/backup/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const cd = res.headers.get('content-disposition') ?? ''
      const match = cd.match(/filename="([^"]+)"/)
      a.href = url
      a.download = match?.[1] ?? 'cmmc-backup.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Export failed. Please try again.')
    } finally {
      setExportWorking(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setImportPhase(file ? 'confirm' : 'idle')
    setImportError(null)
    e.target.value = ''
  }

  async function handleImport() {
    if (!selectedFile) return
    setImportPhase('working')
    setImportError(null)

    const form = new FormData()
    form.append('file', selectedFile)

    try {
      const res = await fetch('/api/admin/backup/import', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setImportPhase('done')
        setSelectedFile(null)
      } else {
        setImportError((data as { error?: string }).error ?? 'Import failed.')
        setImportPhase('error')
      }
    } catch {
      setImportError('Network error. Import did not complete.')
      setImportPhase('error')
    }
  }

  function resetImport() {
    setSelectedFile(null)
    setImportPhase('idle')
    setImportError(null)
  }

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="border border-border bg-card/30 p-4 space-y-3 text-xs text-muted-foreground leading-relaxed">
        <p className="command-kicker">How backup & restore works</p>
        <div className="grid gap-4 sm:grid-cols-2 mt-2">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Export (backup)</p>
            <p>Downloads a JSON snapshot of all your data — practice statuses, notes, owners, POA&M items, and activity history. Does not include uploaded evidence files. Safe to run at any time without affecting the live database.</p>
            <p className="text-[11px]">Recommended: export before any major changes or on a regular schedule.</p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Import (restore)</p>
            <p>Replaces <span className="text-amber-300 font-semibold">all current data</span> with the contents of a backup file. This is a full wipe-and-restore — every practice status, POA&M item, and history entry will be overwritten. <span className="text-amber-300">This cannot be undone.</span></p>
            <p className="text-[11px]">Use to recover from a bad state or migrate to a new instance.</p>
          </div>
        </div>
        <p className="text-[11px] border-t border-border pt-2">
          Note: uploaded evidence files (attachments) are stored separately in a Docker volume and are not included in this backup. Back those up separately by copying the <code className="font-mono">evidence_data</code> Docker volume.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-start gap-4">

        {/* Export */}
        <div className="space-y-1.5">
          <button
            onClick={handleExport}
            disabled={exportWorking}
            className="border border-border/80 bg-card/40 px-4 py-2 text-xs text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {exportWorking ? 'Preparing download…' : 'Export backup'}
          </button>
          <p className="text-[11px] text-muted-foreground">Downloads a .json file to your computer.</p>
        </div>

        {/* Import */}
        <div className="space-y-1.5">
          {importPhase === 'idle' && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="border border-border/80 bg-card/40 px-4 py-2 text-xs text-foreground transition-colors hover:bg-accent"
              >
                Import backup…
              </button>
              <p className="text-[11px] text-muted-foreground">Select a previously exported .json file.</p>
            </>
          )}

          {importPhase === 'confirm' && selectedFile && (
            <div className="border border-amber-900/60 bg-amber-950/20 p-3 space-y-2 max-w-sm">
              <p className="text-xs font-semibold text-amber-300">Confirm restore</p>
              <p className="text-xs text-muted-foreground">
                File: <span className="text-foreground font-mono">{selectedFile.name}</span>
              </p>
              <p className="text-xs text-amber-200/80">
                This will wipe all current data and replace it with this backup. There is no undo.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleImport}
                  className="border border-red-900/60 bg-red-950/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/50 transition-colors"
                >
                  Restore now
                </button>
                <button
                  onClick={resetImport}
                  className="border border-border/70 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {importPhase === 'working' && (
            <p className="text-xs text-muted-foreground">Restoring… please wait.</p>
          )}

          {importPhase === 'done' && (
            <div className="flex items-center gap-3">
              <p className="text-xs text-green-400">Restore complete. Reload the page to see your data.</p>
              <button onClick={() => window.location.reload()} className="text-xs text-muted-foreground underline hover:text-foreground">
                Reload
              </button>
            </div>
          )}

          {importPhase === 'error' && (
            <div className="space-y-1.5">
              <p className="text-xs text-destructive">{importError}</p>
              <button onClick={resetImport} className="text-xs text-muted-foreground hover:text-foreground underline">
                Try again
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>
    </div>
  )
}
