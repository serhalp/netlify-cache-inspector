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

export const saveRun = async (run: Run): Promise<void> => {
  // Validate the run data before saving
  if (run.url) {
    try {
      new URL(run.url) // oxlint-disable-line no-new -- validation only
    } catch {
      throw new Error(`Cannot save run with invalid URL: ${run.url}`)
    }
  }

  await runs.setJSON(run.runId, run)
}

export const findRun = async (runId: string): Promise<Run | null> =>
  runs.get(runId, { type: 'json' })

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

export const saveReport = async (report: Report): Promise<void> => {
  await reports.setJSON(report.reportId, report)
}

export const findReport = async (reportId: string): Promise<Report | null> =>
  reports.get(reportId, { type: 'json' })

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
