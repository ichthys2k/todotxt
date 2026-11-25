import { defineConfig } from 'vitest/config'

// Eigene Konfiguration für Tests, damit die PWA-/Build-Plugins aus vite.config.ts nicht mitlaufen.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
