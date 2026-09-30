import { createError, defineEventHandler, readBody } from 'h3'
import { findReport, findRun, saveReport } from '~server/db'
import { generateReportId, parseRunIds } from '~server/reports'

export default defineEventHandler(async (event) => {
  const runIds = parseRunIds(await readBody(event))

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

  // Same run set → same ID, so re-saving is a no-op that keeps the original timestamp
  const existingReport = await findReport(reportId)
  if (existingReport) {
    return existingReport
  }

  const report = { reportId, runIds, createdAt: new Date().toISOString() }
  await saveReport(report)

  return report
})
