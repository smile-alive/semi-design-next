import { clamp } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { isSecondaryPress } from '../utils/pointer';
import ColorPickerFoundation from './foundation';
import type { DragPointerEvent, RangeKeyEvent } from './interface';

/** `value` and `max` are integer steps of one slider: hue over 360, opacity as a percentage over 100 */
export interface ColorSliderBaseProps {
    width: number;
    value: number;
    max: number;
    onChange: (value: number) => void;
}

export interface ColorSliderBaseState {
    isHandleGrabbing: boolean;
}

export interface ColorSliderAdapter<P extends ColorSliderBaseProps = ColorSliderBaseProps> extends DefaultAdapter<P, ColorSliderBaseState> {
    getDOM: () => HTMLDivElement;
    notifyChange: (value: number) => void;
}

export default class ColorSliderFoundation<P extends ColorSliderBaseProps = ColorSliderBaseProps> extends BaseFoundation<ColorSliderAdapter<P>, P, ColorSliderBaseState> {
    #pickByPointer(e: { clientX: number }) {
        const rect = this.adapter.getDOM()?.getBoundingClientRect();
        if (!rect) {
            return;
        }
        const { width, max } = this.getProps();
        this.adapter.notifyChange(Math.round(clamp((e.clientX - rect.x) / width, 0, 1) * max));
    }

    static getInitialState(): ColorSliderBaseState {
        return { isHandleGrabbing: false };
    }

    static getHandlePosition({ value, max, width }: Pick<ColorSliderBaseProps, 'value' | 'max' | 'width'>, handleSize: number) {
        return (value / max) * width - handleSize / 2;
    }

    /** Captures the pointer from the press, so moves and release arrive outside the slider too */
    handlePointerDown = (e: DragPointerEvent) => {
        // a context menu or middle click must not pick a color
        if (isSecondaryPress(e)) {
            return;
        }
        e.currentTarget.setPointerCapture(e.pointerId);
        this.setState({ isHandleGrabbing: true });
        this.#pickByPointer(e);
    };

    handlePointerMove = (e: DragPointerEvent) => {
        if (this.getState('isHandleGrabbing')) {
            this.#pickByPointer(e);
        }
    };

    /** Follows pointerup and pointercancel; also fires when the slider leaves the page mid-drag */
    handleLostPointerCapture = () => {
        this.setState({ isHandleGrabbing: false });
    };

    // assistive-technology increments arrive as input events on the range
    setValue = (value: number) => {
        this.adapter.notifyChange(value);
    };

    handleKeyDown = (e: RangeKeyEvent) => {
        // Alt/Ctrl/Meta combinations are browser shortcuts (e.g. Alt+Left)
        if (e.altKey || e.ctrlKey || e.metaKey) {
            return;
        }
        const { value, max } = this.getProps();
        const next = ColorPickerFoundation.getValueByKey(e.key, value, max);
        if (next === null) {
            return;
        }
        // the native range would step by itself: the value is controlled
        e.preventDefault();
        this.setValue(next);
    };
}
