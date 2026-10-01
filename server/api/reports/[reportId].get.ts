import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getReport, getRun } from '~server/db'
import { REPORT_ID_PATTERN } from '~server/reports'

export default defineEventHandler(async (event) => {
  const reportId = getRouterParam(event, 'reportId')

  // Reject malformed IDs before they reach the blob store or fan out into run reads
  if (!reportId || !REPORT_ID_PATTERN.test(reportId)) {
    throw createError({
      statusCode: 404,
      message: 'Report not found',
    })
  }

  const report = await getReport(reportId)
  const runs = await Promise.all(report.runIds.map((runId) => getRun(runId)))

  return { ...report, runs }
})
