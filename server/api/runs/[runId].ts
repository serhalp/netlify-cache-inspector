import { getRun } from '~server/db'

export default defineEventHandler(async (event) => {
  const runId = getRouterParam(event, 'runId')

  if (!runId) {
    throw createError({
      statusCode: 400,
      message: 'Missing runId parameter',
    })
  }

  try {
    console.log(`[DEBUG] Fetching run with ID: ${runId}`)
    const run = await getRun(runId)

    // Add URL validation for debugging
    if (run.url) {
      try {
        new URL(run.url)
        console.log(`[DEBUG] Run URL is valid: ${run.url}`)
      }
      catch (urlError) {
        console.error(`[DEBUG] Invalid URL in run data: ${run.url}`, urlError)
        throw createError({
          statusCode: 500,
          message: `Invalid URL in stored run data: ${run.url}`,
        })
      }
    }

    console.log(`[DEBUG] Successfully returning run for ${runId}`)
    return run
  }
  catch (error) {
    console.error(`[DEBUG] Error fetching run ${runId}:`, error)

    // Enhanced error handling for the specific URL parsing error
    if (error && typeof error.message === 'string' && error.message.includes('Failed to parse URL')) {
      throw createError({
        statusCode: 500,
        message: `URL parsing error for run ${runId}: ${error.message}`,
      })
    }

    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch run',
    })
  }
})
