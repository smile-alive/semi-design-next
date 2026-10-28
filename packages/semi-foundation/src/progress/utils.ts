import { clamp } from 'es-toolkit';
import { tween } from '../utils/tween';

export function calcPercent(percent: number) {
    return clamp(percent, 0, 100);
}

export interface CircleGeometry {
    center: number;
    radius: number;
    circumference: number;
    strokeDasharray: string;
    strokeDashoffset: number;
}

/** Indeterminate uses a fixed arc (30% of the circumference) that CSS rotates, so percent is ignored there. */
export function calcCircleGeometry(diameter: number, strokeWidth: number, percent: number, indeterminate: boolean): CircleGeometry {
    const radius = (diameter - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    return {
        center: diameter / 2,
        radius,
        circumference,
        strokeDasharray: indeterminate ? `${circumference * 0.3} ${circumference}` : `${circumference} ${circumference}`,
        strokeDashoffset: indeterminate ? 0 : (1 - percent / 100) * circumference,
    };
}

export interface PercentAnimation {
    /** Call when `percent` changed from `previous` to `next`; `shown` is the number currently displayed */
    update: (next: number, previous: number, shown: number, motion: boolean) => void;
    /** Cancels the running tween; call on unmount */
    stop: () => void;
}

/** Eases the number shown in the text towards the new percent; a new update or `stop` cancels the running tween */
export function createPercentAnimation(setShown: (value: number) => void): PercentAnimation {
    let cancel: (() => void) | undefined;
    const stop = () => {
        cancel?.();
        cancel = undefined;
    };
    return {
        update(next, previous, shown, motion) {
            if (Number.isNaN(next) || Number.isNaN(previous)) {
                throw new Error('[Semi Progress]:percent can not be NaN');
            }
            stop();
            if (!motion) {
                setShown(next);
                return;
            }
            cancel = tween({
                from: shown,
                to: next,
                duration: 300,
                onFrame: (value) => setShown(Math.trunc(value)),
                onEnd: () => setShown(next),
            });
        },
        stop,
    };
}
