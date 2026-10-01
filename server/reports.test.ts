import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MAX_RUNS_PER_REPORT, createReport, generateReportId, parseRunIds } from './reports'
import { findReport, findRun, saveReport } from './db'

vi.mock('./db', () => ({
  findRun: vi.fn(),
  findReport: vi.fn(),
  saveReport: vi.fn(),
}))

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

describe('createReport', () => {
  const runIds = ['aaaaaaaa', 'bbbbbbbb']
  const reportId = generateReportId(runIds)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findRun).mockResolvedValue({
      runId: 'x',
      url: 'https://example.com',
      status: 200,
      headers: {},
      durationInMs: 1,
    })
  })

  it('saves and returns a new report', async () => {
    vi.mocked(saveReport).mockResolvedValue(true)

    const report = await createReport(runIds)

    expect(report).toMatchObject({ reportId, runIds })
    expect(saveReport).toHaveBeenCalledWith(expect.objectContaining({ reportId, runIds }))
    expect(findReport).not.toHaveBeenCalled()
  })

  it('rejects a run that does not exist', async () => {
    vi.mocked(findRun).mockResolvedValueOnce(null)

    await expect(createReport(runIds)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Run not found: aaaaaaaa',
    })
    expect(saveReport).not.toHaveBeenCalled()
  })

  it('returns the existing report when the same run set was already saved', async () => {
    vi.mocked(saveReport).mockResolvedValue(false)
    const existing = { reportId, runIds, createdAt: '2026-01-01T00:00:00.000Z' }
    vi.mocked(findReport).mockResolvedValue(existing)

    await expect(createReport(runIds)).resolves.toEqual(existing)
  })

  it('refuses to hand out a colliding report ID', async () => {
    vi.mocked(saveReport).mockResolvedValue(false)
    vi.mocked(findReport).mockResolvedValue({
      reportId,
      runIds: ['cccccccc', 'dddddddd'],
      createdAt: '2026-01-01T00:00:00.000Z',
    })

    await expect(createReport(runIds)).rejects.toMatchObject({ statusCode: 500 })
  })
})
