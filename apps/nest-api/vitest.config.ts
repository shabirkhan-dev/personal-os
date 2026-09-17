import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
	test: {
		environment: 'node',
		globals: true,
		include: ['src/**/*.spec.ts'],
		setupFiles: [path.resolve(__dirname, 'test/setup-unit-env.ts')],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json-summary'],
		},
	},
});
