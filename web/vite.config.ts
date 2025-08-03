import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@livekit/components-react": path.resolve(
        __dirname,
        "../components-js/packages/react/src"
      ),
      "@livekit/components-core": path.resolve(
        __dirname,
        "../components-js/packages/core/src"
      ),
      "livekit-client": path.resolve(
        __dirname,
        "../client-sdk-js/src"
      ),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
})
