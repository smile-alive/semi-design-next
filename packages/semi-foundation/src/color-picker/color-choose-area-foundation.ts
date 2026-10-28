import { clamp } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { isSecondaryPress } from '../utils/pointer';
import ColorPickerFoundation from './foundation';
import type { DragPointerEvent, HsvaColor, RangeKeyEvent } from './interface';

export interface ColorChooseAreaBaseProps {
    hsva: HsvaColor;
    onChange: (newColor: { s: number; v: number }) => void;
    handleSize: number;
    width: number;
    height: number;
}

export interface ColorChooseAreaBaseState {
    isHandleGrabbing: boolean;
}

export interface ColorChooseAreaAdapter<P extends ColorChooseAreaBaseProps = ColorChooseAreaBaseProps, S extends ColorChooseAreaBaseState = ColorChooseAreaBaseState> extends DefaultAdapter<P, S> {
    getDOM: () => HTMLDivElement;
    notifyChange: (newColor: { s: number; v: number }) => void;
}

export default class ColorChooseAreaFoundation<P extends ColorChooseAreaBaseProps = ColorChooseAreaBaseProps, S extends ColorChooseAreaBaseState = ColorChooseAreaBaseState> extends BaseFoundation<ColorChooseAreaAdapter<P, S>, P, S> {
    constructor(adapter: ColorChooseAreaAdapter<P, S>) {
        super({
            ...adapter,
        });
    }

    // assistive-technology increments arrive as input events on the range
    setValue(axis: 's' | 'v', value: number) {
        const { hsva } = this.getProps();
        this._adapter.notifyChange({ s: hsva.s, v: hsva.v, [axis]: value });
    }

    // two-dimensional: keys follow the screen whichever range has focus (Left/Right saturation, Up/Down/page keys
    // brightness); Home and End act on the focused axis
    handleKeyDown = (focusedAxis: 's' | 'v', e: RangeKeyEvent) => {
        // Alt/Ctrl/Meta combinations are browser shortcuts (e.g. Alt+Left)
        if (e.altKey || e.ctrlKey || e.metaKey) {
            return;
        }
        let axis = focusedAxis;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            axis = 's';
        } else if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) {
            axis = 'v';
        }
        const value = ColorPickerFoundation.getValueByKey(e.key, this.getProps().hsva[axis], 100);
        if (value === null) {
            return;
        }
        // the native range would step by itself: the value is controlled
        e.preventDefault();
        this.setValue(axis, value);
    };

    /** Captures the pointer from the press; positions outside pick the nearest edge or corner */
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

    /** Follows pointerup and pointercancel; also fires when the area leaves the page mid-drag */
    handleLostPointerCapture = () => {
        this.setState({ isHandleGrabbing: false });
    };

    pickByPointer = (e: { clientX: number; clientY: number }) => {
        const rect = this._adapter.getDOM()?.getBoundingClientRect();
        if (!rect) {
            return;
        }
        const { width, height } = this.getProps();
        this._adapter.notifyChange({
            s: Math.round(clamp((e.clientX - rect.x) / width, 0, 1) * 100),
            v: Math.round(100 - clamp((e.clientY - rect.y) / height, 0, 1) * 100),
        });
    };
}
