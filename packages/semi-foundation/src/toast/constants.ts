import { BASE_CLASS_PREFIX } from '../base/constants';
import { toCssLength } from '../utils/dom';

const PREFIX = `${BASE_CLASS_PREFIX}-toast`;
export const cssClasses = {
    PREFIX,
    WRAPPER: `${PREFIX}-wrapper`,
};

export const strings = {
    themes: ['normal', 'light'],
};

export const builtInOpts = {
    motion: true,
    zIndex: 1010,
    content: '',
};

export const positions = ['top', 'left', 'bottom', 'right'] as const;

export function setPosition(wrapper: HTMLElement, opts: Partial<Record<(typeof positions)[number], number | string>>) {
    for (const pos of positions) {
        if (pos in opts) {
            wrapper.style[pos] = toCssLength(opts[pos]) ?? '';
        }
    }
}

export const numbers = {
    duration: 3, // default close time, unit: s
    stackThreshold: 3, // `stack: true` lays out up to this many toasts flat and stacks from the next one
    stackVisibleCount: 3, // a collapsed stack shows this many layers; the ones behind them are hidden
    stackLayerDepth: 10, // how far back a toast sits per newer toast in front of it, unit: px
};

/** Reserves depth for the newer toasts in front, so a collapsed stack keeps them on top */
export function getStackLayerTransform(positionInList?: { index: number; length: number }) {
    const newer = positionInList ? positionInList.length - positionInList.index - 1 : 0;
    return `translate3d(0,0,${newer * -numbers.stackLayerDepth}px)`;
}
