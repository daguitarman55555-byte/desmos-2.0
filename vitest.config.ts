import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // core/ is pure maths and must run in plain Node with no DOM available — that is the
    // point of the dependency rule. UI is verified by screenshot, not by unit test.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
