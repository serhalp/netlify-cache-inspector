import { createError, defineEventHandler, getRouterParam, isNuxtError } from 'nuxt/server'
import { getRun } from '~server/db'
import { RUN_ID_PATTERN } from '#shared/reports'

export default defineEventHandler(async (event) => {
  const runId = getRouterParam(event, 'runId')

  // Reject malformed IDs before they reach the blob store
  if (!runId || !RUN_ID_PATTERN.test(runId)) {
    throw createError({
      status: 404,
      message: 'Run not found',
    })
  }

  try {
    const run = await getRun(runId)
    return run
  } catch (error) {
    // Let the 404 from the store through instead of masking it as a 500
    if (isNuxtError(error) && error.status === 404) throw error
    throw createError({
      status: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch run',
    })
  }
})
