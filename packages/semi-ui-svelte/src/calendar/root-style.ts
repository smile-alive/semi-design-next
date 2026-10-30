import { toCssLength } from '@fibrae/semi-foundation/utils/dom';

/** The root's style: `height` and `width` come first, so the caller's `style` still overrides them */
export function rootStyle(style?: string | null, width?: number | string, height?: number | string) {
    return [height != null && `height: ${toCssLength(height)}`, width != null && `width: ${toCssLength(width)}`, style].filter(Boolean).join(';') || undefined;
}
