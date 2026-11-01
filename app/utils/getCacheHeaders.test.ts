import { describe, it, expect } from 'vitest'

import getCacheHeaders from './getCacheHeaders'

describe('getCacheHeaders', () => {
  it('keeps Expires so a cache lifetime can be derived from it', () => {
    const headers = new Headers(
      getCacheHeaders({
        Expires: 'Wed, 21 Oct 2015 08:28:00 GMT',
        'X-Ignored': 'nope',
      }),
    )

    expect(headers.get('Expires')).toBe('Wed, 21 Oct 2015 08:28:00 GMT')
    expect(headers.has('X-Ignored')).toBe(false)
  })
})
