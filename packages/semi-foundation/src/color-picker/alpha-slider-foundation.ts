import { clamp } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { isSecondaryPress } from '../utils/pointer';
import ColorPickerFoundation from './foundation';
import type { DragPointerEvent, HsvaColor, RangeKeyEvent } from './interface';

export interface AlphaSliderBaseProps {
    width: number;
    height: number;
    hsva: HsvaColor;
    handleSize: number;
    foundation: ColorPickerFoundation;
}

export interface AlphaSliderBaseState {
    isHandleGrabbing: boolean;
}

export interface AlphaSliderAdapter<P extends AlphaSliderBaseProps = AlphaSliderBaseProps, S extends AlphaSliderBaseState = AlphaSliderBaseState> extends DefaultAdapter<P, S> {
    getDOM: () => HTMLDivElement;
}

export default class AlphaSliderFoundation<P extends AlphaSliderBaseProps = AlphaSliderBaseProps, S extends AlphaSliderBaseState = AlphaSliderBaseState> extends BaseFoundation<AlphaSliderAdapter<P, S>, P, S> {
    constructor(adapter: AlphaSliderAdapter<P, S>) {
        super({
            ...adapter,
        });
    }

    #pickByPointer(e: { clientX: number }) {
        const rect = this._adapter.getDOM()?.getBoundingClientRect();
        if (!rect) {
            return;
        }
        const { width, foundation } = this.getProps();
        foundation.handleAlphaChangeByHandle({
            a: Number(clamp((e.clientX - rect.x) / width, 0, 1).toFixed(2)),
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
    setValue = (percent: number) => {
        this.getProps().foundation.handleAlphaChangeByHandle({ a: percent / 100 });
    };

    handleKeyDown = (e: RangeKeyEvent) => {
        // Alt/Ctrl/Meta combinations are browser shortcuts (e.g. Alt+Left)
        if (e.altKey || e.ctrlKey || e.metaKey) {
            return;
        }
        const percent = ColorPickerFoundation.getValueByKey(e.key, this.getProps().hsva.a * 100, 100);
        if (percent === null) {
            return;
        }
        // the native range would step by itself: the value is controlled
        e.preventDefault();
        this.setValue(percent);
    };
}
