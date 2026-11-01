import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
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

  return getRun(runId)
})
