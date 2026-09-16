import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build works both at loggers.hakonvidir.is and at the
// hakonharalds.github.io/universal-loggers/ fallback URL.
export default defineConfig({
  base: './',
  plugins: [react()],
})
