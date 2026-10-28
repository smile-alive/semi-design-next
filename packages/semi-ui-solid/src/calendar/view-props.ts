import type { JSX } from 'solid-js';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import mergeStyles from '../_base/merge-styles';

/** The props every view declares itself; the rest go to the root element */
export const viewPropKeys = [
    'allDayEventsRender',
    'class',
    'dateGridRender',
    'displayValue',
    'events',
    'header',
    'height',
    'markWeekend',
    'minEventHeight',
    'onClick',
    'onClose',
    'onMoreClick',
    'range',
    'ref',
    'renderDateDisplay',
    'renderTimeDisplay',
    'scrollTop',
    'showCurrTime',
    'style',
    'weekStartsOn',
    'width',
] as const;

/** The root's style: `width` and `height` come first, so the caller's `style` can still override them */
export function rootStyle(style?: JSX.CSSProperties | string, width?: string | number, height?: string | number): JSX.CSSProperties | string {
    return mergeStyles({ height: toCssLength(height), width: toCssLength(width) }, style);
}
