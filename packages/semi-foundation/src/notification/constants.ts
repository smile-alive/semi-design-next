import { BASE_CLASS_PREFIX } from '../base/constants';

export const cssClasses = {
    WRAPPER: `${BASE_CLASS_PREFIX}-notification-wrapper`,
    LIST: `${BASE_CLASS_PREFIX}-notification-list`,
    NOTICE: `${BASE_CLASS_PREFIX}-notification-notice`,
};

export const strings = {
    types: ['warning', 'success', 'info', 'error', 'default'],
    directions: ['ltr', 'rtl'] as const,
};

export const numbers = {
    duration: 3, // default close time, unit: s
    stackThreshold: 3, // `stack: true` lays out up to this many notices flat and stacks from the next one
    stackVisibleCount: 3, // a collapsed stack shows this many layers; the ones behind them are hidden
    stackOffset: 8, // how far each layer of a collapsed stack peeks out behind the one in front, unit: px
    stackScaleStep: 0.05, // how much narrower each layer of a collapsed stack is than the one in front
};

/** Where a collapsed stack shows the notice `depth` layers behind the newest; bottom placements stack upwards */
export function getStackItemTransform(depth: number, placement: string) {
    const sign = placement.startsWith('bottom') ? -1 : 1;
    return `translateY(${sign * depth * numbers.stackOffset}px) scaleX(${1 - depth * numbers.stackScaleStep})`;
}

export function getStackThreshold(stack?: boolean | number) {
    return stack === true ? numbers.stackThreshold : typeof stack === 'number' ? Math.max(stack, 0) : 0;
}
