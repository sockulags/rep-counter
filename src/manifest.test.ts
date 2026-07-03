import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type ManifestIcon = {
  src: string
  sizes: string
  type: string
  purpose: string
}

function readManifest() {
  return JSON.parse(readFileSync(resolve(__dirname, '../public/manifest.webmanifest'), 'utf8'))
}

describe('PWA manifest', () => {
  it('keeps install URLs inside the GitHub Pages app scope', () => {
    const manifest = readManifest()

    expect(manifest.start_url).toBe('./')
    expect(manifest.scope).toBe('./')
    for (const icon of manifest.icons as ManifestIcon[]) {
      expect(icon.src.startsWith('./')).toBe(true)
    }
  })

  it('provides PNG icons for both any and maskable purposes', () => {
    const icons = readManifest().icons as ManifestIcon[]
    const pngIcons = icons.filter((icon) => icon.type === 'image/png')

    for (const purpose of ['any', 'maskable']) {
      const sizes = pngIcons
        .filter((icon) => icon.purpose === purpose)
        .map((icon) => icon.sizes)
      expect(sizes).toContain('192x192')
      expect(sizes).toContain('512x512')
    }

    expect(icons.some((icon) => icon.purpose.includes(' '))).toBe(false)
  })

  it('ships every referenced icon file with a valid PNG or SVG header', () => {
    const icons = readManifest().icons as ManifestIcon[]
    const files = [...icons.map((icon) => icon.src.slice(2)), 'apple-touch-icon.png']

    for (const file of files) {
      const path = resolve(__dirname, '../public', file)
      expect(existsSync(path), `${file} should exist`).toBe(true)

      const header = readFileSync(path).subarray(0, 8)
      if (file.endsWith('.png')) {
        expect(header.toString('hex'), `${file} should be a PNG`).toBe('89504e470d0a1a0a')
      } else {
        expect(readFileSync(path, 'utf8')).toContain('<svg')
      }
    }
  })

  it('links the apple-touch-icon from the app shell', () => {
    const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8')
    expect(html).toContain('rel="apple-touch-icon"')
    expect(html).toContain('href="/apple-touch-icon.png"')
  })
})
