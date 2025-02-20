import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

import { buildConfig } from './vite.config';

let env;

export default defineConfig(async ({ command, mode }) => {
    env = loadEnv(mode, process.cwd(), '');

    return await buildConfig(resolve(__dirname, 'src/browser.js'), env);
})