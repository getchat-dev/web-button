import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

import { buildConfig } from './vite.config';

let env;

export default defineConfig(async ({ command, mode }) => {
    env = loadEnv(mode, process.cwd(), '');
    const config = await buildConfig(resolve(__dirname, 'src/browser.js'), env, mode);

    config.build.lib.formats = ['umd']

    // remove dts plugin from the plugins array
    config.plugins.shift();

    return config;
})