import { getReport, getRun } from '~server/db'

export default defineEventHandler(async (event) => {
  const reportId = getRouterParam(event, 'reportId')

  if (!reportId) {
    throw createError({
      statusCode: 400,
      message: 'Missing reportId parameter',
    })
  }

  try {
    const report = await getReport(reportId)
    
    // Fetch all runs for this report
    const runs = await Promise.all(
      report.runIds.map(runId => getRun(runId))
    )
    
    // Set cache headers similar to /run/ endpoints
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    
    return {
      reportId: report.reportId,
      createdAt: report.createdAt,
      runs
    }
  }
  catch (error) {
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch report',
    })
  }
})