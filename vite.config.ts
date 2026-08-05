import { defineConfig } from 'vite';

/**
 * Port comes from the environment when the harness assigns one, so the dev server never fights
 * another project for a fixed port. 5180 is only the fallback for a bare `npm run dev`.
 *
 * Read off globalThis rather than importing node:process, which would need @types/node just for
 * this one lookup.
 */
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const PORT = Number(env?.['PORT']) || 5180;

export default defineConfig({
  server: { port: PORT, strictPort: false },
  build: { target: 'es2022', outDir: 'dist', sourcemap: true },
});
