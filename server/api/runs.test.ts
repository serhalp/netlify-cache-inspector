import { createHash } from 'crypto'
import { describe, it, expect } from 'vitest'

// Function to generate runId (copied from the actual implementation)
const generateRunId = (url: string, timestamp: number): string =>
  createHash('sha256')
    .update(`${url}-${timestamp}`)
    .digest('hex')
    .slice(0, 8)

describe('Permalink functionality with percent-encoded URLs', () => {
  it('generates consistent runId for percent-encoded URLs', () => {
    const url = 'https://netlify.com/timestamp/key/%2Fnodejs%2Fmiddleware'
    const timestamp = 1640995200000 // Fixed timestamp for consistency

    const runId1 = generateRunId(url, timestamp)
    const runId2 = generateRunId(url, timestamp)

    expect(runId1).toBe(runId2)
    expect(runId1).toHaveLength(8)
    expect(typeof runId1).toBe('string')
  })

  it('generates different runIds for different URLs', () => {
    const timestamp = 1640995200000
    const url1 = 'https://netlify.com/path%20with%20spaces'
    const url2 = 'https://netlify.com/path with spaces' // decoded version

    const runId1 = generateRunId(url1, timestamp)
    const runId2 = generateRunId(url2, timestamp)

    expect(runId1).not.toBe(runId2)
  })

  it('generates different runIds for different timestamps', () => {
    const url = 'https://netlify.com/timestamp/key/%2Fnodejs%2Fmiddleware'
    const timestamp1 = 1640995200000
    const timestamp2 = 1640995200001

    const runId1 = generateRunId(url, timestamp1)
    const runId2 = generateRunId(url, timestamp2)

    expect(runId1).not.toBe(runId2)
  })

  it('handles complex percent-encoded URLs in runId generation', () => {
    const complexUrl = 'https://netlify.com/api%2Fv1%2Fusers%3Fq%3Dtest%26sort%3Dname%20desc'
    const timestamp = 1640995200000

    const runId = generateRunId(complexUrl, timestamp)

    expect(runId).toHaveLength(8)
    expect(typeof runId).toBe('string')
    expect(runId).toMatch(/^[a-f0-9]{8}$/) // Should be hex
  })

  it('URL normalization works correctly for permalink storage', () => {
    // Test that URL constructor normalizes URLs properly
    const testCases = [
      {
        input: 'https://netlify.com/timestamp/key/%2Fnodejs%2Fmiddleware',
        expected: 'https://netlify.com/timestamp/key/%2Fnodejs%2Fmiddleware',
      },
      {
        input: 'https://netlify.com/../test%20path',
        expected: 'https://netlify.com/test%20path',
      },
      {
        input: 'https://netlify.com/./path%20with%20spaces',
        expected: 'https://netlify.com/path%20with%20spaces',
      },
    ]

    testCases.forEach(({ input, expected }) => {
      const parsedUrl = new URL(input)
      expect(parsedUrl.href).toBe(expected)
    })
  })

  it('validates that percent-encoding is preserved through serialization', () => {
    const url = 'https://netlify.com/timestamp/key/%2Fnodejs%2Fmiddleware'
    const mockRun = {
      runId: 'test123',
      url: url,
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=3600' },
      durationInMs: 150,
    }

    // Simulate JSON serialization/deserialization
    const serialized = JSON.stringify(mockRun)
    const deserialized = JSON.parse(serialized)

    expect(deserialized.url).toBe(url)
    expect(deserialized.url).toContain('%2F')
  })
})
