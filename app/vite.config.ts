import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import katex from 'katex'

/**
 * Called during vite build, which is called during pnpm build
 * Takes all the <tex> components in the blog post HTML and renders math there
 **/
function katexBuildPlugin(): Plugin {
  return {
    name: 'katex-build',
    enforce: 'pre',
    load(id) {
      if (!id.includes('/blog-posts/') || !id.endsWith('.html?raw')) return
      const filePath = id.replace('?raw', '')
      const html = readFileSync(filePath, 'utf-8')
      const processed = html
        .replace(/<tex\s+display>([\s\S]*?)<\/tex>/g, (_, tex) =>
          katex.renderToString(tex.trim(), { displayMode: true, throwOnError: true })
        )
        .replace(/<tex>([\s\S]*?)<\/tex>/g, (_, tex) =>
          katex.renderToString(tex.trim(), { displayMode: false, throwOnError: true })
        )
      return `export default ${JSON.stringify(processed)}`
    },
  }
}

export default defineConfig({
  plugins: [katexBuildPlugin(), react()],
})
