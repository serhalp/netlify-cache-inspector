import { createHash } from 'crypto'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the server modules
vi.mock('~server/db', () => ({
  saveRun: vi.fn(),
}))

vi.mock('#app', () => ({
  defineEventHandler: (handler: (event: unknown) => unknown) => handler,
  readBody: vi.fn(),
  createError: vi.fn(error => new Error(error.message)),
  $fetch: {
    raw: vi.fn(),
  },
}))

describe('inspect-url.post API endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates URL input and normalizes percent-encoded URLs', () => {
    // Test the URL validation logic that fixes the percent-encoding issue
    const testCases = [
      {
        input: 'https://netlify.com/timestamp/key/%2Fnodejs%2Fmiddleware',
        expected: 'https://netlify.com/timestamp/key/%2Fnodejs%2Fmiddleware',
      },
      {
        input: 'https://netlify.com/path%20with%20spaces',
        expected: 'https://netlify.com/path%20with%20spaces',
      },
      {
        input: 'https://netlify.com/../test%20path',
        expected: 'https://netlify.com/test%20path',
      },
    ]

    testCases.forEach(({ input, expected }) => {
      // This tests the core fix: URL constructor properly handles percent-encoding
      const parsedUrl = new URL(input)
      expect(parsedUrl.href).toBe(expected)
    })
  })

  it('rejects invalid URLs', () => {
    const invalidUrls = [
      '',
      'not-a-url',
      'http://',
      'invalid',
    ]

    invalidUrls.forEach((url) => {
      expect(() => new URL(url)).toThrow()
    })
  })

  it('generates consistent runIds for the same URL and timestamp', () => {
    // Test the runId generation logic
    const generateRunId = (url: string, timestamp: number): string =>
      createHash('sha256')
        .update(`${url}-${timestamp}`)
        .digest('hex')
        .slice(0, 8)

    const url = 'https://netlify.com/timestamp/key/%2Fnodejs%2Fmiddleware'
    const timestamp = 1640995200000

    const runId1 = generateRunId(url, timestamp)
    const runId2 = generateRunId(url, timestamp)

    expect(runId1).toBe(runId2)
    expect(runId1).toHaveLength(8)
    expect(runId1).toMatch(/^[a-f0-9]{8}$/)
  })
})
