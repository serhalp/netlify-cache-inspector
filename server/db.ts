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
  // Validate the run data before saving
  if (run.url) {
    try {
      new URL(run.url)
    }
    catch (urlError) {
      console.error(`[DEBUG] Invalid URL in run data before saving: ${run.url}`, urlError)
      throw new Error(`Cannot save run with invalid URL: ${run.url}`)
    }
  }

  console.log(`[DEBUG] Saving run to database:`, JSON.stringify(run, null, 2))
  await runs.setJSON(run.runId, run)
  console.log(`[DEBUG] Successfully saved run ${run.runId}`)
}

export const getRun = async (runId: string): Promise<Run> => {
  console.log(`[DEBUG] Getting run from database: ${runId}`)

  try {
    const run: Run | null = await runs.get(runId, { type: 'json' })

    if (!run) {
      console.error(`[DEBUG] Run not found in database: ${runId}`)
      throw createError({
        statusCode: 404,
        message: 'Run not found',
      })
    }

    console.log(`[DEBUG] Retrieved run from database:`, JSON.stringify(run, null, 2))

    return run
  }
  catch (error) {
    console.error(`[DEBUG] Database error for runId ${runId}:`, error)
    throw error
  }
}
