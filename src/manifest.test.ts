import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('PWA manifest', () => {
  it('keeps install URLs inside the GitHub Pages app scope', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(__dirname, '../public/manifest.webmanifest'), 'utf8'),
    )

    expect(manifest.start_url).toBe('./')
    expect(manifest.scope).toBe('./')
    expect(manifest.icons[0].src).toBe('./app-icon.svg')
  })
})
