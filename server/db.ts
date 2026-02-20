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
  createdAt: number
}

const runs = getStore({ name: 'runs' })
const reports = getStore({ name: 'reports' })

export const saveRun = async (run: Run): Promise<void> => {
  // Validate the run data before saving
  if (run.url) {
    try {
      new URL(run.url)
    }
    catch {
      throw new Error(`Cannot save run with invalid URL: ${run.url}`)
    }
  }

  await runs.setJSON(run.runId, run)
}

export const getRun = async (runId: string): Promise<Run> => {
  const run: Run | null = await runs.get(runId, { type: 'json' })

  if (!run) {
    throw createError({
      statusCode: 404,
      message: 'Run not found',
    })
  }

  return run
}

export const saveReport = async (report: Report): Promise<void> => {
  await reports.setJSON(report.reportId, report)
}

export const getReport = async (reportId: string): Promise<Report> => {
  const report: Report | null = await reports.get(reportId, { type: 'json' })

  if (!report) {
    throw createError({
      statusCode: 404,
      message: 'Report not found',
    })
  }

  return report
}
