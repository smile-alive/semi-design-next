import type { Breakpoint } from './constants';

export type Gutter = number | Partial<Record<Breakpoint, number>>;

export const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

export function normalizeGutter(gutter?: Gutter | [Gutter, Gutter]): [Gutter | undefined, Gutter | undefined] {
    return Array.isArray(gutter) ? [gutter[0], gutter[1]] : [gutter, undefined];
}

/** Read back by grid.scss */
export function gutterVarName(axis: 'x' | 'y', breakpoint: Breakpoint) {
    return `--semi-row-gutter-${axis}-${breakpoint}`;
}

/**
 * sm and up cascade mobile-first: an unset breakpoint takes the nearest smaller one. xs is a `max-width` range that
 * never overlaps sm+, so it neither inherits nor cascades. Negative gutters count as 0.
 */
export function resolveGutterByBreakpoint(gutter?: Gutter) {
    const resolveAt = (breakpoint: Breakpoint) => {
        if (gutter == null) {
            return 0;
        }
        if (typeof gutter !== 'object') {
            return Math.max(gutter, 0);
        }
        if (breakpoint === 'xs') {
            return Math.max(gutter.xs ?? 0, 0);
        }
        const rank = breakpoints.indexOf(breakpoint);
        for (let r = rank; r >= 1; r--) {
            const value = gutter[breakpoints[r]];
            if (value !== undefined) {
                return Math.max(value, 0);
            }
        }
        return 0;
    };
    return Object.fromEntries(breakpoints.map((bp) => [bp, resolveAt(bp)])) as Record<Breakpoint, number>;
}

// every breakpoint is written, even as 0px, so a nested Row does not inherit the outer Row's gutter
export function gutterStyle(axis: 'x' | 'y', gutter?: Gutter): Record<string, string> {
    const resolved = resolveGutterByBreakpoint(gutter);
    return Object.fromEntries(breakpoints.map((bp) => [gutterVarName(axis, bp), `${resolved[bp]}px`]));
}
