/** Attributes every rendered icon svg carries besides its own: sized by the font, out of the tab order, decorative */
export const defaultAttrs: Record<string, string> = {
    width: '1em',
    height: '1em',
    focusable: 'false',
    'aria-hidden': 'true',
};

/**
 * Fills a multi-colour icon's attribute placeholders: `{fillN}` takes the Nth of `colors` (from getFillColor),
 * `{uid}` an id unique to the instance
 */
export function resolveValue(value: string, colors: string[], uid: string) {
    return value.replace(/\{(?:fill(\d)|uid)\}/g, (_match, index?: string) => (index === undefined ? uid : colors[Number(index)]));
}

/** The colours of a multi-colour icon: `num` is the icon's `fills`, `fill` the colour or colours the user passed */
export function getFillColor(fill: string | string[] | undefined, num: number) {
    if (typeof fill === 'string') {
        return Array.from({ length: num }, () => fill);
    } else if (Array.isArray(fill)) {
        const fillLength = fill.length;
        let result: string[] = fill;
        if (fillLength < num) {
            let i = 0;
            result = [];
            while (i < num) {
                result.push(fill[i % fillLength]);
                i++;
            }
            return result;
        } else if (fillLength > num) {
            result = fill.slice(0, num);
        }
        if (num === 4) {
            // result may be the caller's own array, so it must not be reversed in place
            return result.toReversed();
        }
        return result;
    }
    if (num === 2) {
        return ['rgba(166,71,255)', 'currentColor'];
    }
    return ['rgba(233,69,255)', 'rgba(166,71,255)', 'rgba(107,97,255)', 'rgba(46,140,255)'];
}
