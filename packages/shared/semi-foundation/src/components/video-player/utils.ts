import { clamp } from 'es-toolkit';
import { formatLocale } from '../../locale/index';

/** The clock form of a time: mm:ss, and h:mm:ss from one hour on. A non-finite time (an unknown duration) reads 00:00. */
export function formatTime(time: number) {
    const total = Number.isFinite(time) ? Math.floor(time) : 0;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = String(total % 60).padStart(2, '0');
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`;
    }
    return `${String(minutes).padStart(2, '0')}:${seconds}`;
}

export interface TimeTexts {
    timeHms: string;
    timeMs: string;
    timeS: string;
}

/** The spoken form of a time, since a screen reader reads "1:05" as a ratio rather than a duration. */
export function formatTimeText(time: number, texts: TimeTexts) {
    const total = Number.isFinite(time) ? Math.floor(time) : 0;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const padded = String(seconds).padStart(2, '0');
    if (hours > 0) {
        return formatLocale(texts.timeHms, { hours, minutes, seconds: padded });
    }
    if (minutes > 0) {
        return formatLocale(texts.timeMs, { minutes, seconds: padded });
    }
    return formatLocale(texts.timeS, { seconds });
}

/**
 * Where a pointer is along a slider track: `offset` from the track's start (the left edge, or the bottom edge when
 * vertical) in px and the `ratio` of the track's `total` length, both clamped to the track: a captured pointer keeps
 * reporting positions past either end during a drag.
 */
export function getPointerRatio(rect: Pick<DOMRect, 'left' | 'bottom' | 'width' | 'height'>, point: { clientX: number; clientY: number }, vertical: boolean) {
    const total = vertical ? rect.height : rect.width;
    const offset = clamp(vertical ? rect.bottom - point.clientY : point.clientX - rect.left, 0, total);
    return { offset, total, ratio: offset / total };
}
