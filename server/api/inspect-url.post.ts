import { createHash } from 'crypto'
import { createError, defineEventHandler, readBody } from 'nuxt/server'
import { $fetch } from 'ofetch'
import { saveRun } from '~server/db'

const generateRunId = (url: string, timestamp: number): string =>
  createHash('sha256').update(`${url}-${timestamp}`).digest('hex').slice(0, 8)

export default defineEventHandler(async (event) => {
  // h3 v2 returns undefined for an empty body
  const { url } = (await readBody<{ url?: string }>(event)) ?? {}

  if (!url) {
    throw createError({
      status: 400,
      message: 'Please provide a URL to inspect',
    })
  }

  // Validate and normalize URL before processing
  let normalizedUrl: string
  try {
    const parsedUrl = new URL(url)
    normalizedUrl = parsedUrl.href // This ensures proper URL encoding
  } catch {
    throw createError({
      status: 400,
      message: `Invalid URL provided: ${url}`,
    })
  }

  const startTime = Date.now()
  // Use $fetch.raw to get both response status and headers, and ignoreResponseError
  // to prevent automatic error throwing on 4xx/5xx responses (we want to inspect those too).
  // responseType 'stream' skips downloading the body; we only need headers.
  const response = await $fetch.raw(normalizedUrl, {
    headers: {
      'x-nf-debug-logging': '1',
    },
    ignoreResponseError: true,
    responseType: 'stream',
  })
  const { status, headers } = response
  const durationInMs = Date.now() - startTime
  await response.body?.cancel()

  if (!headers.has('X-NF-Request-Id')) {
    throw createError({
      status: 400,
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

  // 32-bit IDs can collide; never overwrite an existing run since reports reference it by ID
  // oxlint-disable-next-line no-await-in-loop -- each retry depends on the previous write's outcome
  for (let attempt = 0; !(await saveRun(run)); attempt++) {
    if (attempt >= 5) {
      throw createError({
        status: 500,
        message: 'Could not allocate a unique run ID',
      })
    }
    run.runId = generateRunId(`${normalizedUrl}#${attempt}`, Date.now())
  }

  return run
})
