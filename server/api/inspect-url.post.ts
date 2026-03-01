import { createHash } from 'crypto'
import { saveRun } from '~server/db'

const generateRunId = (url: string, timestamp: number): string =>
  createHash('sha256').update(`${url}-${timestamp}`).digest('hex').slice(0, 8)

export default defineEventHandler(async (event) => {
  const { url } = await readBody(event)

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
  } catch {
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

  if (!headers.has('X-NF-Request-Id')) {
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

  return run
})
