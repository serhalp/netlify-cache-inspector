import { createHash } from 'crypto'
import { saveRun } from '~server/db'

const generateRunId = (url: string, timestamp: number): string =>
  createHash('sha256')
    .update(`${url}-${timestamp}`)
    .digest('hex')
    .slice(0, 8)

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
  }
  catch {
    throw createError({
      statusCode: 400,
      message: `Invalid URL provided: ${url}`,
    })
  }

  const startTime = Date.now()
  // TODO(serhalp) `$fetch` automatically throws on 4xx, but we'd like to treat those as valid.
  const { status, headers } = await $fetch.raw(normalizedUrl, {
    headers: {
      'x-nf-debug-logging': '1',
    },
  })
  const durationInMs = Date.now() - startTime

  // TODO(serhalp) What about sites with an extra proxy on top? Maybe check for a debug response
  // header instead?
  if (headers.get('Server') !== 'Netlify') {
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
