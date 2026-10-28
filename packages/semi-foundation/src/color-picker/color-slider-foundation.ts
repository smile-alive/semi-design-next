import { clamp } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { isSecondaryPress } from '../utils/pointer';
import ColorPickerFoundation from './foundation';
import type { DragPointerEvent, RangeKeyEvent } from './interface';

export interface ColorSliderBaseProps {
    width: number;
    height: number;
    hue: number;
    handleSize: number;
    foundation: ColorPickerFoundation;
}

export interface ColorSliderBaseState {
    isHandleGrabbing: boolean;
}

export interface ColorSliderAdapter<P extends ColorSliderBaseProps = ColorSliderBaseProps, S extends ColorSliderBaseState = ColorSliderBaseState> extends DefaultAdapter<P, S> {
    getDOM: () => HTMLDivElement;
}

export default class ColorSliderFoundation<P extends ColorSliderBaseProps = ColorSliderBaseProps, S extends ColorSliderBaseState = ColorSliderBaseState> extends BaseFoundation<ColorSliderAdapter<P, S>, P, S> {
    constructor(adapter: ColorSliderAdapter<P, S>) {
        super({
            ...adapter,
        });
    }

    /** Captures the pointer from the press, so moves and release arrive outside the slider too */
    handlePointerDown = (e: DragPointerEvent) => {
        // a context menu or middle click must not pick a color
        if (isSecondaryPress(e)) {
            return;
        }
        e.currentTarget.setPointerCapture(e.pointerId);
        this.setState({ isHandleGrabbing: true });
        this.pickByPointer(e);
    };

    handlePointerMove = (e: DragPointerEvent) => {
        if (this.getState('isHandleGrabbing')) {
            this.pickByPointer(e);
        }
    };

    /** Follows pointerup and pointercancel; also fires when the slider leaves the page mid-drag */
    handleLostPointerCapture = () => {
        this.setState({ isHandleGrabbing: false });
    };

    // assistive-technology increments arrive as input events on the range
    setValue(h: number) {
        this.getProps().foundation.handleColorChangeByHandle({ h });
    }

    handleKeyDown = (e: RangeKeyEvent) => {
        // Alt/Ctrl/Meta combinations are browser shortcuts (e.g. Alt+Left)
        if (e.altKey || e.ctrlKey || e.metaKey) {
            return;
        }
        const h = ColorPickerFoundation.getValueByKey(e.key, this.getProps().hue, 360);
        if (h === null) {
            return;
        }
        // the native range would step by itself: the value is controlled
        e.preventDefault();
        this.setValue(h);
    };

    pickByPointer = (e: { clientX: number }) => {
        const rect = this._adapter.getDOM()?.getBoundingClientRect();
        if (!rect) {
            return;
        }
        const { width, foundation } = this.getProps();
        foundation.handleColorChangeByHandle({
            h: Math.round(clamp((e.clientX - rect.x) / width, 0, 1) * 360),
        });
    };
}
