import { createRequire } from 'node:module';
import path from 'node:path';

/**
 * Locates semi-icons-core's dist/ from this package's own dependency. Under pnpm's isolated layout an app does not see
 * packages it has not installed directly, so the caller cannot be asked for the path; `from` is for tests.
 */
export function resolveIconPath(from: string | URL = import.meta.url) {
    const stylesheet = createRequire(from).resolve('@fibrae/semi-icons-core/styles/icons.scss');
    return path.resolve(stylesheet, '../..');
}

/** Locates semi-foundation's dist/ the same way; dist/ has no single entry stylesheet, so anchor on the exported package.json */
export function resolveFoundationPath(from: string | URL = import.meta.url) {
    return path.join(path.dirname(createRequire(from).resolve('@fibrae/semi-foundation/package.json')), 'dist');
}
