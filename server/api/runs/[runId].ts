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
    const run = await getRun(runId)

    // Validate that the URL in the run is properly formatted
    if (run.url) {
      try {
        // This will throw if the URL is malformed
        new URL(run.url)
      }
      catch (urlError) {
        console.error('Invalid URL in stored run:', run.url, urlError)
        throw createError({
          statusCode: 500,
          message: 'Stored run contains invalid URL',
        })
      }
    }

    return run
  }
  catch (error) {
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch run',
    })
  }
})
