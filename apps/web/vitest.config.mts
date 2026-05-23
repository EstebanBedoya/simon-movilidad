import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  test: {
    server: {
      deps: {
        inline: ['lucide-react'],
      },
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      exclude: [
        'node_modules/**',
        '.next/**',
        'vitest.config.mts',
        'vitest.setup.ts',
        '**/*.d.ts',
        'types/auth.types.ts',
        'types/alert.types.ts',
        'types/telemetry.types.ts',
        'types/vehicle.types.ts',
        'public/**',
      ],
    },
  },
})
