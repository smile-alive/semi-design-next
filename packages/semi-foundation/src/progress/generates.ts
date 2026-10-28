import { strings } from './constants';

type StrokeSet = { percent: number; color: string };

export type StrokeArr = Array<StrokeSet>;

const PALETTE_TOKEN = /^(?:(black|white)|(amber|blue|cyan|green|grey|indigo|light-blue|light-green|lime|orange|pink|purple|red|teal|violet|yellow)(?:-(\d))?)$/;

/**
 * Picks the stroke color for `percent` from the color stops in `s`. The result is a CSS color expression
 * (`var(--semi-...)` or `color-mix()`), so theme switches apply without a re-render.
 */
export function generateColor(s: StrokeArr, percent: number, gradient: boolean): string | undefined {
    if (s.length === 0) return undefined;
    const sorted = s.toSorted((a, b) => a.percent - b.percent);
    if (sorted[0].percent > percent) {
        return strings.STROKE_DEFAULT;
    }
    const nextIndex = sorted.findIndex((item) => item.percent >= percent);
    if (nextIndex === -1) {
        return toCssColor(sorted.at(-1).color);
    }
    const next = sorted[nextIndex];
    if (next.percent === percent) {
        return toCssColor(next.color);
    }
    const prev = sorted[nextIndex - 1];
    if (!gradient) {
        return toCssColor(prev.color);
    }
    const t = ((percent - prev.percent) / (next.percent - prev.percent)) * 100;
    return `color-mix(in srgb, ${toCssColor(next.color)} ${t}%, ${toCssColor(prev.color)})`;
}

function toCssColor(color: string) {
    const match = PALETTE_TOKEN.exec(color.trim().toLowerCase());
    if (!match) return color;
    const [, single, hue, shade = '5'] = match;
    return `var(--semi-${single ?? `${hue}-${shade}`})`;
}
