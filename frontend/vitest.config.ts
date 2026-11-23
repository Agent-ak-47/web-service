import { defineConfig } from 'vitest/config';


export default defineConfig({
    test: {
        coverage: {
            provider: 'istanbul',
            reporter: ['text-summary', 'lcov', 'html'],
            reportsDirectory: 'coverage',
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.spec.ts', 'src/test-providers.ts', 'src/main.ts'],
        },
    },
});
