import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Static single-page build for Firebase Hosting (see firebase.json). The app has
			// ssr = false, so every route is served index.html and renders in the browser.
			adapter: adapter({ fallback: 'index.html' })
		})
	]
});
