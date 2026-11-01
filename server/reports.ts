import { createHash } from 'crypto'
import { createError } from 'nuxt/server'
import { MAX_RUNS_PER_REPORT, RUN_ID_PATTERN } from '#shared/reports'
import { findReport, findRun, saveReport, type Report } from './db'

// Content-addressed, so a saved run set is immutable and "editing" one yields a new ID.
// 12 chars (vs 8 for runs) because a collision would serve someone else's report.
export const generateReportId = (runIds: string[]): string =>
  createHash('sha256').update(JSON.stringify(runIds)).digest('hex').slice(0, 12)

export const parseRunIds = (body: unknown): string[] => {
  const runIds = (body as { runIds?: unknown } | null)?.runIds

  if (!Array.isArray(runIds) || runIds.length === 0) {
    throw createError({
      status: 400,
      message: 'Please provide a non-empty list of run IDs',
    })
  }

  if (runIds.length > MAX_RUNS_PER_REPORT) {
    throw createError({
      status: 400,
      message: `A report may contain at most ${MAX_RUNS_PER_REPORT} runs`,
    })
  }

  for (const runId of runIds) {
    if (typeof runId !== 'string' || !RUN_ID_PATTERN.test(runId)) {
      throw createError({
        status: 400,
        message: `Invalid run ID: ${typeof runId === 'string' ? runId : typeof runId}`,
      })
    }
  }

  if (new Set(runIds).size !== runIds.length) {
    throw createError({
      status: 400,
      message: 'A report cannot contain the same run more than once',
    })
  }

  return runIds
}

const sameRunIds = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((runId, i) => runId === b[i])

export const createReport = async (runIds: string[]): Promise<Report> => {
  // Every referenced run must exist so a report permalink can never resolve to a partial report
  const runsExist = await Promise.all(runIds.map(async (runId) => (await findRun(runId)) !== null))
  const missingRunId = runIds.find((_, i) => !runsExist[i])
  if (missingRunId) {
    throw createError({
      status: 400,
      message: `Run not found: ${missingRunId}`,
    })
  }

  const reportId = generateReportId(runIds)
  const report = { reportId, runIds, createdAt: new Date().toISOString() }

  // Conditional write keeps the first save's timestamp even under concurrent identical requests
  if (await saveReport(report)) {
    return report
  }

  const existingReport = await findReport(reportId)
  if (!existingReport || !sameRunIds(existingReport.runIds, runIds)) {
    // Truncated hash collided with a different run set; refuse rather than hand out the wrong link
    throw createError({
      status: 500,
      message: 'Report ID collision, please try a different set of runs',
    })
  }

  return existingReport
}
