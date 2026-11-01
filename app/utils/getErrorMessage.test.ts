import { describe, it, expect } from 'vitest'
import getErrorMessage from './getErrorMessage'

describe('getErrorMessage', () => {
  it('prefers the message from the API error body', () => {
    const err = Object.assign(new Error('[GET] "/api/runs/x": 404'), {
      data: { message: 'Run not found' },
    })
    expect(getErrorMessage(err)).toBe('Run not found')
  })

  it('falls back to the error text', () => {
    expect(getErrorMessage(new Error('HTTP 500'))).toBe('Error: HTTP 500')
  })

  it('handles non-error values', () => {
    expect(getErrorMessage('boom')).toBe('boom')
  })
})
