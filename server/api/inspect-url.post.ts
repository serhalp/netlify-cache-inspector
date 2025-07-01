import { createHash } from 'crypto'
import { saveRun, saveReport, getReport } from '~server/db'

const generateRunId = (url: string, timestamp: number): string =>
  createHash('sha256')
    .update(`${url}-${timestamp}`)
    .digest('hex')
    .slice(0, 8)

const generateReportId = (runIds: string[], timestamp: number): string =>
  createHash('sha256')
    .update(`${runIds.join(',')}-${timestamp}`)
    .digest('hex')
    .slice(0, 8)

export default defineEventHandler(async (event) => {
  const { url, currentReportId } = await readBody(event)

  if (!url) {
    throw createError({
      statusCode: 400,
      message: 'Please provide a URL to inspect',
    })
  }

  // Validate and normalize URL before processing
  let normalizedUrl: string
  try {
    const parsedUrl = new URL(url)
    normalizedUrl = parsedUrl.href // This ensures proper URL encoding
  }
  catch {
    throw createError({
      statusCode: 400,
      message: `Invalid URL provided: ${url}`,
    })
  }

  const startTime = Date.now()
  // Use $fetch.raw to get both response status and headers, and ignoreResponseError
  // to prevent automatic error throwing on 4xx/5xx responses (we want to inspect those too)
  const { status, headers } = await $fetch.raw(normalizedUrl, {
    headers: {
      'x-nf-debug-logging': '1',
    },
    ignoreResponseError: true,
  })
  const durationInMs = Date.now() - startTime

  // TODO(serhalp) What about sites with an extra proxy on top? Maybe check for a debug response
  // header instead?
  if (headers.get('Server') !== 'Netlify') {
    throw createError({
      statusCode: 400,
      message: 'This tool can only be used with Netlify sites',
    })
  }

  const run = {
    runId: generateRunId(normalizedUrl, Date.now()),
    url: normalizedUrl, // Use normalized URL
    status,
    headers: Object.fromEntries(headers),
    durationInMs,
  }

  await saveRun(run)

  // Handle report creation/updating
  let newReportId: string
  const timestamp = Date.now()
  
  if (currentReportId) {
    try {
      // Get existing report and create a new one with the additional run
      const existingReport = await getReport(currentReportId)
      const newRunIds = [...existingReport.runIds, run.runId]
      newReportId = generateReportId(newRunIds, timestamp)
      
      const newReport = {
        reportId: newReportId,
        runIds: newRunIds,
        createdAt: timestamp,
      }
      
      await saveReport(newReport)
    }
    catch {
      // If existing report not found, create a new one with just this run
      newReportId = generateReportId([run.runId], timestamp)
      const newReport = {
        reportId: newReportId,
        runIds: [run.runId],
        createdAt: timestamp,
      }
      
      await saveReport(newReport)
    }
  } else {
    // Create a new report with just this run
    newReportId = generateReportId([run.runId], timestamp)
    const newReport = {
      reportId: newReportId,
      runIds: [run.runId],
      createdAt: timestamp,
    }
    
    await saveReport(newReport)
  }

  return {
    ...run,
    reportId: newReportId,
  }
})
