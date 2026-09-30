import { createHash } from 'crypto'
import { createError } from 'h3'

export const MAX_RUNS_PER_REPORT = 20

// Matches the run IDs we generate; also keeps arbitrary input out of blob keys
const RUN_ID_PATTERN = /^[a-z0-9]{8}$/

// Content-addressed: the same ordered run set always yields the same report, so reports are
// immutable and "editing" one produces a new ID. Longer than run IDs since a collision here
// would silently serve someone else's report.
export const generateReportId = (runIds: string[]): string =>
  createHash('sha256').update(JSON.stringify(runIds)).digest('hex').slice(0, 12)

export const parseRunIds = (body: unknown): string[] => {
  const runIds = (body as { runIds?: unknown } | null)?.runIds

  if (!Array.isArray(runIds) || runIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Please provide a non-empty list of run IDs',
    })
  }

  if (runIds.length > MAX_RUNS_PER_REPORT) {
    throw createError({
      statusCode: 400,
      message: `A report may contain at most ${MAX_RUNS_PER_REPORT} runs`,
    })
  }

  for (const runId of runIds) {
    if (typeof runId !== 'string' || !RUN_ID_PATTERN.test(runId)) {
      throw createError({
        statusCode: 400,
        message: `Invalid run ID: ${String(runId)}`,
      })
    }
  }

  if (new Set(runIds).size !== runIds.length) {
    throw createError({
      statusCode: 400,
      message: 'A report cannot contain the same run more than once',
    })
  }

  return runIds
}
