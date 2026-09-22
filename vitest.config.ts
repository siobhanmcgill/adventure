import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    pool: 'vmThreads', // 'vmForks',
    passWithNoTests: true,
    environment: 'jsdom',
    css: {
      include: [/styles\/.*\.scss/]
    },
    setupFiles: ['./src/ts/tests/test_setup.ts'],
    expect: {
      poll: {
        timeout: 500
      }
    },
    browser: {
      enabled: true,
      detailsPanelPosition: 'bottom',
      provider: playwright(),
      testerHtmlPath: './src/index-tests.html',
      instances: [
        {
          browser: 'chromium',
          viewport: {width: 1100, height: 1100},
        },
      ],
    },
  },
});
