import { describe, it, expect } from 'vitest'
import { MAX_RUNS_PER_REPORT, generateReportId, parseRunIds } from './reports'

const REPORT_ID_PATTERN = /^[0-9a-f]{12}$/

describe('generateReportId', () => {
  it('is deterministic for the same ordered run IDs', () => {
    expect(generateReportId(['aaaaaaaa', 'bbbbbbbb'])).toBe(
      generateReportId(['aaaaaaaa', 'bbbbbbbb']),
    )
  })

  it('differs when the order changes', () => {
    expect(generateReportId(['aaaaaaaa', 'bbbbbbbb'])).not.toBe(
      generateReportId(['bbbbbbbb', 'aaaaaaaa']),
    )
  })

  it('differs when a run is added', () => {
    expect(generateReportId(['aaaaaaaa'])).not.toBe(generateReportId(['aaaaaaaa', 'bbbbbbbb']))
  })

  it('produces a 12-character lowercase hex ID', () => {
    expect(generateReportId(['aaaaaaaa'])).toMatch(REPORT_ID_PATTERN)
  })
})

describe('parseRunIds', () => {
  it('returns the run IDs from a valid body', () => {
    expect(parseRunIds({ runIds: ['aaaaaaaa', '0123abcd'] })).toEqual(['aaaaaaaa', '0123abcd'])
  })

  it.each([
    ['null body', null],
    ['missing runIds', {}],
    ['non-array runIds', { runIds: 'aaaaaaaa' }],
    ['empty runIds', { runIds: [] }],
  ])('rejects %s', (_, body) => {
    expect(() => parseRunIds(body)).toThrow('non-empty list of run IDs')
  })

  it('rejects more than the maximum number of runs', () => {
    const runIds = Array.from({ length: MAX_RUNS_PER_REPORT + 1 }, (_, i) =>
      i.toString().padStart(8, '0'),
    )
    expect(() => parseRunIds({ runIds })).toThrow('at most')
  })

  it.each([
    ['a non-string', 42],
    ['an uppercase ID', 'AAAAAAAA'],
    ['a short ID', 'aaaa'],
    ['a path-like ID', '../../aa'],
  ])('rejects %s', (_, runId) => {
    expect(() => parseRunIds({ runIds: ['aaaaaaaa', runId] })).toThrow('Invalid run ID')
  })

  it('rejects duplicate run IDs', () => {
    expect(() => parseRunIds({ runIds: ['aaaaaaaa', 'aaaaaaaa'] })).toThrow('more than once')
  })
})
