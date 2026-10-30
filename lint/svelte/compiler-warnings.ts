import path from 'node:path';
import { svelteExemptions } from './exemptions.ts';

const root = path.resolve(import.meta.dirname, '../..');

// `compilerOptions.warningFilter` for the svelte.config.js files: false drops a warning the file's exemption lists
export function warningFilter({ code, filename }: { code: string; filename?: string }) {
    if (!filename) return true;
    const file = path.relative(root, path.resolve(filename));
    return !svelteExemptions.some(({ files, compilerOff = [] }) => compilerOff.includes(code) && files.some((glob) => path.matchesGlob(file, glob)));
}
