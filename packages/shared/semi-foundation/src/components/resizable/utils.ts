import { minBy } from 'es-toolkit';
import type { Direction, Enable } from './types';

// not es-toolkit clamp: min wins when min > max, as CSS min-width beats max-width
export function clamp(n: number, min: number, max: number) {
    return Math.max(Math.min(n, max), min);
}
/**
 * One keyboard tab stop per axis: the right edge for the width and the bottom edge for the height, or the opposite
 * edge when only that one is enabled. The other edges and the corners differ only in which side stays put, which
 * means nothing to a keyboard user.
 */
export function isKeyboardEdge(enable: Enable, dir: Direction) {
    return dir === 'right' || dir === 'bottom' || (dir === 'left' && enable.right === false) || (dir === 'top' && enable.bottom === false);
}
export function snap(n: number, size: number) {
    return Math.round(n / size) * size;
}
export function has(dir: 'top' | 'right' | 'bottom' | 'left', target: string) {
    return new RegExp(dir, 'i').test(target);
}
export function findNextSnap(n: number, snapArray: number[], snapGap: number = 0) {
    const closest = minBy(snapArray, (v) => Math.abs(v - n));
    return snapGap === 0 || Math.abs(closest - n) < snapGap ? closest : n;
}
export function getStringSize(n: number | string) {
    const s = n.toString();
    return s === 'auto' || /(px|%|vh|vw|vmax|vmin)$/.test(s) ? s : `${s}px`;
}
export function getNumberSize(size: undefined | string | number, parentSize: number, innerWidth: number, innerHeight: number) {
    if (size && typeof size === 'string') {
        if (size.endsWith('px')) {
            return Number(size.replace('px', ''));
        }
        if (size.endsWith('%')) {
            const ratio = Number(size.replace('%', '')) / 100;
            return parentSize * ratio;
        }
        if (size.endsWith('vw')) {
            const ratio = Number(size.replace('vw', '')) / 100;
            return innerWidth * ratio;
        }
        if (size.endsWith('vh')) {
            const ratio = Number(size.replace('vh', '')) / 100;
            return innerHeight * ratio;
        }
    }
    return typeof size === 'undefined' ? size : Number(size);
}
export function calculateNewMax(parentSize: { width: number; height: number }, innerWidth: number, innerHeight: number, maxWidth?: string | number, maxHeight?: string | number, minWidth?: string | number, minHeight?: string | number) {
    maxWidth = getNumberSize(maxWidth, parentSize.width, innerWidth, innerHeight);
    maxHeight = getNumberSize(maxHeight, parentSize.height, innerWidth, innerHeight);
    minWidth = getNumberSize(minWidth, parentSize.width, innerWidth, innerHeight);
    minHeight = getNumberSize(minHeight, parentSize.height, innerWidth, innerHeight);
    return {
        maxWidth,
        maxHeight,
        minWidth,
        minHeight,
    };
}
export function getItemDirection(dir: 'vertical' | 'horizontal'): [Direction, Direction] {
    if (dir === 'vertical') {
        return ['bottom', 'top'];
    } else {
        return ['right', 'left'];
    }
}
