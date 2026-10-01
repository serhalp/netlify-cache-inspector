import { createHash } from 'crypto'
import { createError } from 'h3'
import { findReport, findRun, saveReport } from './db'

export const MAX_RUNS_PER_REPORT = 20

// Matches the IDs we generate; also keeps arbitrary input out of blob keys
export const RUN_ID_PATTERN = /^[a-z0-9]{8}$/
export const REPORT_ID_PATTERN = /^[a-z0-9]{12}$/

// Content-addressed: the same ordered run set always yields the same report, so reports are
// immutable and "editing" one produces a new ID. Longer than run IDs since a collision here
// would silently serve someone else's report.
export const generateReportId = (runIds: string[]): string =>
  createHash('sha256').update(JSON.stringify(runIds)).digest('hex').slice(0, 12)

export const parseRunIds = (body: unknown): string[] => {
  const runIds = (body as { runIds?: unknown } | null)?.runIds

  if (!Array.isArray(runIds) || runIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Please provide a non-empty list of run IDs',
    })
  }

  if (runIds.length > MAX_RUNS_PER_REPORT) {
    throw createError({
      statusCode: 400,
      message: `A report may contain at most ${MAX_RUNS_PER_REPORT} runs`,
    })
  }

  for (const runId of runIds) {
    if (typeof runId !== 'string' || !RUN_ID_PATTERN.test(runId)) {
      throw createError({
        statusCode: 400,
        message: `Invalid run ID: ${typeof runId === 'string' ? runId : typeof runId}`,
      })
    }
  }

  if (new Set(runIds).size !== runIds.length) {
    throw createError({
      statusCode: 400,
      message: 'A report cannot contain the same run more than once',
    })
  }

  return runIds
}

const sameRunIds = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((runId, i) => runId === b[i])

export const createReport = async (runIds: string[]) => {
  // Every referenced run must exist so a report permalink can never resolve to a partial report
  const runsExist = await Promise.all(runIds.map(async (runId) => (await findRun(runId)) !== null))
  const missingRunId = runIds.find((_, i) => !runsExist[i])
  if (missingRunId) {
    throw createError({
      statusCode: 400,
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
      statusCode: 500,
      message: 'Report ID collision, please try a different set of runs',
    })
  }

  return existingReport
}
