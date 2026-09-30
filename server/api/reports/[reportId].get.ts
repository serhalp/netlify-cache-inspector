import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getReport, getRun } from '~server/db'

export default defineEventHandler(async (event) => {
  const reportId = getRouterParam(event, 'reportId')

  if (!reportId) {
    throw createError({
      statusCode: 400,
      message: 'Missing reportId parameter',
    })
  }

  const report = await getReport(reportId)
  const runs = await Promise.all(report.runIds.map((runId) => getRun(runId)))

  return { ...report, runs }
})
