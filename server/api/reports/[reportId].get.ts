import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { getReport, getRun } from '~server/db'
import { REPORT_ID_PATTERN } from '#shared/reports'

export default defineEventHandler(async (event) => {
  const reportId = getRouterParam(event, 'reportId')

  // Reject malformed IDs before they reach the blob store or fan out into run reads
  if (!reportId || !REPORT_ID_PATTERN.test(reportId)) {
    throw createError({
      status: 404,
      message: 'Report not found',
    })
  }

  const report = await getReport(reportId)
  const runs = await Promise.all(report.runIds.map((runId) => getRun(runId)))

  return { ...report, runs }
})
