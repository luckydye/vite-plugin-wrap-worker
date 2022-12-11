import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		outDir: 'lib',
		lib: {
			entry: 'src/index.ts',
			formats: ['es']
		},
		emptyOutDir: true,
		rollupOptions: {
			external: /^lit/
		}
	}
});
