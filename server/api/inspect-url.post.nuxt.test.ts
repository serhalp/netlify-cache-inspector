/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'

describe('inspect-url.post API', () => {
  it('should pass ignoreResponseError option to $fetch.raw to handle non-success status codes', async () => {
    // Read the source file to verify the fix is present
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const apiFilePath = path.resolve(__dirname, 'inspect-url.post.ts')
    const apiFileContent = await fs.readFile(apiFilePath, 'utf-8')
    
    // Verify that ignoreResponseError: true is present in the $fetch.raw call
    expect(apiFileContent).toContain('ignoreResponseError: true')
    
    // Verify the $fetch.raw call includes the expected options structure
    expect(apiFileContent).toContain('$fetch.raw(url, {')
    expect(apiFileContent).toContain("'x-nf-debug-logging': '1'")
    expect(apiFileContent).toContain('ignoreResponseError: true')
  })

  it('should no longer have the TODO comment about $fetch throwing on 4xx', async () => {
    // Read the source file to verify the TODO comment is removed
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const apiFilePath = path.resolve(__dirname, 'inspect-url.post.ts')
    const apiFileContent = await fs.readFile(apiFilePath, 'utf-8')
    
    // Verify the TODO comment about $fetch throwing on 4xx is removed
    expect(apiFileContent).not.toContain('TODO(serhalp) `$fetch` automatically throws on 4xx')
  })
})