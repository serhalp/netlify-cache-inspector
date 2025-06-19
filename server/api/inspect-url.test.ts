import { describe, it, expect } from 'vitest'

describe('URL handling with percent-encoding', () => {
  it('validates URLs with percent-encoded spaces', () => {
    const url = 'https://netlify.com/path%20with%20spaces'

    // Test that URL constructor properly handles percent-encoded URLs
    expect(() => new URL(url)).not.toThrow()

    const parsedUrl = new URL(url)
    expect(parsedUrl.href).toBe(url)
    expect(parsedUrl.pathname).toBe('/path%20with%20spaces')
  })

  it('validates URLs with percent-encoded forward slashes', () => {
    const url = 'https://netlify.com/timestamp/key/%2Fnodejs%2Fmiddleware'

    expect(() => new URL(url)).not.toThrow()

    const parsedUrl = new URL(url)
    expect(parsedUrl.href).toBe(url)
    expect(parsedUrl.pathname).toBe('/timestamp/key/%2Fnodejs%2Fmiddleware')
  })

  it('validates complex percent-encoded URLs', () => {
    const url = 'https://netlify.com/api%2Fv1%2Fusers%3Fq%3Dtest%26sort%3Dname'

    expect(() => new URL(url)).not.toThrow()

    const parsedUrl = new URL(url)
    expect(parsedUrl.href).toBe(url)
    expect(parsedUrl.pathname).toBe('/api%2Fv1%2Fusers%3Fq%3Dtest%26sort%3Dname')
  })

  it('normalizes URLs while preserving percent-encoding', () => {
    const baseUrl = 'https://netlify.com'

    // Test various percent-encoded characters
    const testCases = [
      '/path%20with%20spaces',
      '/timestamp/key/%2Fnodejs%2Fmiddleware',
      '/api%2Fv1%2Fusers%3Fq%3Dtest%26sort%3Dname',
      '/file%2Ename.txt',
      '/user%40domain.com',
    ]

    testCases.forEach((path) => {
      const fullUrl = baseUrl + path
      const parsedUrl = new URL(fullUrl)

      expect(parsedUrl.href).toBe(fullUrl)
      expect(parsedUrl.pathname).toBe(path)
    })
  })

  it('handles URLs that need normalization', () => {
    // Test URL normalization
    const unnormalizedUrl = 'https://netlify.com/../test%20path'
    const parsedUrl = new URL(unnormalizedUrl)

    expect(parsedUrl.href).toBe('https://netlify.com/test%20path')
    expect(parsedUrl.pathname).toBe('/test%20path')
  })

  it('rejects malformed URLs', () => {
    const malformedUrls = [
      'not-a-url',
      'http://',
      '',
    ]

    malformedUrls.forEach((url) => {
      expect(() => new URL(url)).toThrow()
    })

    // These URLs don't throw in modern browsers but are edge cases
    const edgeCaseUrls = [
      'https://.',
      'ftp://invalid',
    ]

    edgeCaseUrls.forEach((url) => {
      // Just test that they can be parsed, even if they're edge cases
      expect(() => new URL(url)).not.toThrow()
    })
  })

  it('preserves percent-encoding in URL components', () => {
    const url = 'https://netlify.com/search?q=hello%20world&type=user%2Bguide'
    const parsedUrl = new URL(url)

    expect(parsedUrl.href).toBe(url)
    expect(parsedUrl.search).toBe('?q=hello%20world&type=user%2Bguide')
    expect(parsedUrl.searchParams.get('q')).toBe('hello world') // URLSearchParams decodes
    expect(parsedUrl.searchParams.get('type')).toBe('user+guide')
  })
})
