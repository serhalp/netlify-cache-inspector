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
    return run
  }
  catch (error) {
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch run',
    })
  }
})
