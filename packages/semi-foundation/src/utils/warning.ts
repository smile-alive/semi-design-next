/**
 * Whether development-only checks run. The library build keeps `process.env.NODE_ENV` as written (see the vite.config
 * define) for the consumer's bundler to replace; a `typeof process` guard would not be replaced and would read as
 * false in the browser, silencing every check.
 */
export function isDev() {
    return process.env.NODE_ENV !== 'production';
}

/** Prints `info` as a development-time warning when `flag` holds; production builds print nothing */
export default function warning(flag: boolean, info: string) {
    if (flag && isDev()) {
        console.warn(`Warning: ${info}`);
    }
}
