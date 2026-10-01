import { createError } from 'h3'
import { getStore } from '@netlify/blobs'

interface Run {
  runId: string
  url: string
  status: number
  headers: Record<string, string>
  durationInMs: number
}

interface Report {
  reportId: string
  runIds: string[]
  createdAt: string
}

const runs = getStore({ name: 'runs' })
const reports = getStore({ name: 'reports' })

// Reads are eventually consistent by default. A miss right after a write (e.g. saving a report
// seconds after its runs were created) is re-checked at the origin before we call it missing.
const getJSON = async <T>(store: typeof runs, key: string): Promise<T | null> =>
  (await store.get(key, { type: 'json' })) ??
  (await store.get(key, { type: 'json', consistency: 'strong' }))

// Returns false when the key already exists; the caller decides how to react.
// Never overwrites, so permalinks stay immutable even on an ID collision.
export const saveRun = async (run: Run): Promise<boolean> => {
  // Validate the run data before saving
  if (run.url) {
    try {
      new URL(run.url) // oxlint-disable-line no-new -- validation only
    } catch {
      throw new Error(`Cannot save run with invalid URL: ${run.url}`)
    }
  }

  const { modified } = await runs.setJSON(run.runId, run, { onlyIfNew: true })
  return modified
}

export const findRun = async (runId: string): Promise<Run | null> => getJSON<Run>(runs, runId)

export const getRun = async (runId: string): Promise<Run> => {
  const run = await findRun(runId)

  if (!run) {
    throw createError({
      status: 404,
      message: 'Run not found',
    })
  }

  return run
}

export const saveReport = async (report: Report): Promise<boolean> => {
  const { modified } = await reports.setJSON(report.reportId, report, { onlyIfNew: true })
  return modified
}

export const findReport = async (reportId: string): Promise<Report | null> =>
  getJSON<Report>(reports, reportId)

export const getReport = async (reportId: string): Promise<Report> => {
  const report = await findReport(reportId)

  if (!report) {
    throw createError({
      status: 404,
      message: 'Report not found',
    })
  }

  return report
}
