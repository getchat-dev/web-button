import { defineConfig, loadEnv, build } from 'vite';
import { resolve } from 'path';
import replace from '@rollup/plugin-replace';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

const buildConfig = async(entry, env, mode = 'development') => {

    const emptyOutDir = process.argv.includes('--emptyOutDir');

    const pkg = await import('./package.json');
    const version = pkg.version;

    return {
        appType: 'custom',
        root: './src',
        css: {
            transformer: 'lightningcss',
            lightningcss: {
                drafts: {
                    customMedia: true,
                }
            },
        },
        build: {
            sourcemap: mode === 'development',
            cssMinify: 'lightningcss',
            outDir: '../dist',
             // Explicitly set emptyOutDir to avoid the warning:
             // (!) outDir /{outDir} is outside the project root and will not be emptied.
            emptyOutDir,
            modulePreload: false,
            lib: {
                entry: entry,
                name: 'GetChat',
                fileName: (format, entryName) => `${entryName}.js`,
                // fileName: 'index',
                formats: ['es'],
            },
            assetsInlineLimit: 0,
        },
        define: {
            'process.env.VERSION': JSON.stringify(version),
            '__JS_GLOBAL_SCOPE__': JSON.stringify(env.JS_SCOPE_NAME || 'getchat'),
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src'),
            },
        },
        plugins: [
            dts({
                insertTypesEntry: true,
                copyDtsFiles: true,
                staticImport: true
            }),
            cssInjectedByJsPlugin(),
            replace({
                preventAssignment: true,
                '__JS_GLOBAL_SCOPE__': JSON.stringify(env.JS_SCOPE_NAME),
            }),
        ]
    }
}

export { buildConfig }

export default defineConfig(async ({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return await buildConfig({
        index: resolve(__dirname, 'src/index.ts'),
        'timer-worker': resolve(__dirname, 'src/timer-worker.js'),
    }, env, mode);
})