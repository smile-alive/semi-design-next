import path from 'node:path';
import { once } from 'es-toolkit';
import { format, type FormatConfig } from 'oxfmt';
import { loadConfigFromFile } from 'vite';
import { root } from './paths.ts';

// The options `vp fmt` reads from vite.config.ts, so generated files match what the commit hook writes
const fmtOptions = once(async () => {
    const loaded = await loadConfigFromFile({ command: 'build', mode: 'production' }, path.join(root, 'vite.config.ts'));
    const options = (loaded?.config as { fmt?: FormatConfig } | undefined)?.fmt;
    if (!options) throw new Error('vite.config.ts has no fmt options');
    return options;
});

/** Formats in process; spawning `vp fmt` per file costs about half a second each */
export async function formatSource(file: string, source: string) {
    const { code, errors } = await format(file, source, await fmtOptions());
    if (errors.length) throw new Error(`${file}: ${errors[0].message}`);
    return code;
}
