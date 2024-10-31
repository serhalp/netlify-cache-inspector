import { getStore } from '@netlify/blobs'

interface Run {
  runId: string
  url: string
  status: number
  headers: Record<string, string>
  durationInMs: number
}

const runs = getStore({ name: 'runs' })

export const saveRun = async (run: Run): Promise<void> => {
  await runs.setJSON(run.runId, run)
}

export const getRun = async (runId: string): Promise<Run> => {
  const run: Run | null = await runs.get(runId, { type: 'json' })

  if (!run) {
    throw createError({
      statusCode: 404,
      message: 'Run not found',
    })
  }

  return run
}
