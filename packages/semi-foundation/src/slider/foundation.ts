import { clamp, isEqual } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter, type DirectionContext } from '../base/foundation';
import { handlePrevent } from '../utils/a11y';
import { isSecondaryPress } from '../utils/pointer';

export interface Marks {
    [key: number]: unknown;
}

export interface SliderProps {
    defaultValue?: number | number[];
    disabled?: boolean;
    showMarkLabel?: boolean;
    included?: boolean;
    marks?: Marks;
    max?: number;
    min?: number;
    /** Native form field name of the handle inputs; a range submits both values under it */
    name?: string;
    range?: boolean;
    step?: number;
    /** Called once per handle with that handle's value */
    tipFormatter?: ((value: number) => any) | null;
    value?: number | number[];
    vertical?: boolean;
    onAfterChange?: (value: SliderProps['value']) => void;
    onChange?: (value: SliderProps['value']) => void;
    onMouseUp?: (e: any) => void;
    tooltipOnMark?: boolean;
    tooltipVisible?: boolean;
    style?: Record<string, any>;
    showArrow?: boolean;
    className?: string;
    showBoundary?: boolean;
    railStyle?: Record<string, any>;
    verticalReverse?: boolean;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-valuetext'?: string;
    getAriaValueText?: (value: number, index?: number) => string;
    /** One dot for a single handle, one per handle for a range */
    handleDot?: HandleDot | HandleDot[];
}

export interface HandleDot {
    size?: string;
    color?: string;
}

export interface SliderState {
    currentValue: number | number[];
    /** The handle the pointer hovers or drags */
    activeHandle: 'min' | 'max' | '';
    /** The handle last pressed; it keeps its stacking after the drag */
    chooseMovePos: 'min' | 'max' | '';
    isDrag: boolean;
    showBoundary: boolean;
    isInRenderTree: boolean;
    /** The handle whose input has keyboard focus (:focus-visible) */
    focusVisibleHandle: 'min' | 'max' | '';
}

interface SliderLengths {
    sliderX: number;
    sliderY: number;
    sliderWidth: number;
    sliderHeight: number;
}

export interface SliderAdapter<P extends SliderProps = SliderProps, S extends SliderState = SliderState> extends DefaultAdapter<P, S, DirectionContext> {
    getSliderNode: () => HTMLElement | null | undefined;
    notifyChange: (value: number | number[]) => void;
    notifyMouseUp: (e: any) => void;
    notifyAfterChange: (value: number | number[]) => void;
}

type KeyModifiers = 'altKey' | 'ctrlKey' | 'metaKey';

// Alt, Ctrl and Meta combinations are browser shortcuts, not value changes
const hasModifier = (event: Pick<KeyboardEvent, KeyModifiers>) => event.altKey || event.ctrlKey || event.metaKey;

const VALUE_KEYS = ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'PageUp', 'PageDown', 'Home', 'End'];

export default class SliderFoundation<P extends SliderProps = SliderProps, S extends SliderState = SliderState> extends BaseFoundation<SliderAdapter<P, S>, P, S> {
    #dragOffset = 0;
    #dragController: AbortController | null = null;
    #pointerId: number;

    #clampToRange(value: number | number[]) {
        const { min, max } = this.getProps();
        return Array.isArray(value) ? [clamp(value[0], min, max), clamp(value[1], min, max)] : clamp(value, min, max);
    }

    #checkCurrentValue() {
        const { currentValue } = this.getStates();
        const checked = this.#clampToRange(currentValue);
        if (!isEqual(checked, currentValue)) {
            this.setState({ currentValue: checked });
        }
    }

    #noTooltip() {
        const { tipFormatter, tooltipVisible } = this.getProps();
        return tipFormatter === null || tooltipVisible === false;
    }

    #getHandleCenterPosition(vertical: boolean, handle: HTMLElement) {
        const pos = handle.getBoundingClientRect();
        const { x, y } = this.handleMousePos(pos.left + pos.width * 0.5, pos.top + pos.height * 0.5);
        return vertical ? y : x;
    }

    #bindDragEvents(pointerId: number) {
        this.#unbindDragEvents();
        const controller = new AbortController();
        this.#dragController = controller;
        this.#pointerId = pointerId;
        const { signal } = controller;
        window.addEventListener('pointermove', this.#onHandleMove, { signal });
        window.addEventListener('pointerup', this.#onHandleUp, { signal });
        window.addEventListener('pointercancel', this.#onHandleUp, { signal });
    }

    #unbindDragEvents() {
        this.#dragController?.abort();
        this.#dragController = null;
    }

    /** A second finger neither moves nor ends the drag; keyboard events carry no pointer */
    #isOtherPointer(e: any) {
        return typeof e.pointerId === 'number' && e.pointerId !== this.#pointerId;
    }

    #getParentRect(): DOMRect | undefined {
        return this._adapter.getSliderNode()?.offsetParent?.getBoundingClientRect();
    }

    #getSliderLengths(): SliderLengths {
        const slider = this._adapter.getSliderNode();
        if (!slider) {
            return { sliderX: 0, sliderY: 0, sliderWidth: 0, sliderHeight: 0 };
        }
        const rect = slider.getBoundingClientRect();
        const offsetParentRect = slider.offsetParent?.getBoundingClientRect();
        return {
            sliderX: offsetParentRect ? rect.left - offsetParentRect.left : slider.offsetLeft,
            sliderY: offsetParentRect ? rect.top - offsetParentRect.top : slider.offsetTop,
            sliderWidth: rect.width,
            sliderHeight: rect.height,
        };
    }

    #notifyAfterChange() {
        this._adapter.notifyAfterChange(this.normalizeValue(this.getState('currentValue')));
    }

    /** A controlled value only moves through the value prop */
    #moveHandle(nextValue: number | number[], callback?: () => void) {
        this.syncIsInRenderTree();
        if (!this.getState('isInRenderTree')) {
            return;
        }
        if (isEqual(this.normalizeValue(this.getState('currentValue')), nextValue)) {
            return;
        }
        if (this._isControlledComponent()) {
            return;
        }
        this.setState({ currentValue: nextValue }, callback);
    }

    #commitClick(nextValue: number | number[]) {
        this._adapter.notifyChange(nextValue);
        if (this._isControlledComponent()) {
            return;
        }
        this.#moveHandle(nextValue, () => this.#notifyAfterChange());
    }

    #onHandleMove = (e: any) => {
        if (this.#isOtherPointer(e)) {
            return false;
        }
        handlePrevent(e);
        const { chooseMovePos } = this.getStates();
        const { vertical, disabled } = this.getProps();
        if (disabled) {
            return false;
        }
        this.onHandleEnter(chooseMovePos);
        const mousePos = this.handleMousePos(e.clientX, e.clientY);
        const pagePos = (vertical ? mousePos.y : mousePos.x) - this.#dragOffset;
        if (this.getState('isDrag')) {
            const nextValue = this.calculateOutputValue(pagePos, chooseMovePos === 'min');
            if (nextValue === undefined) {
                return false;
            }
            this._adapter.notifyChange(nextValue);
            this.#moveHandle(nextValue);
        }
        return true;
    };

    #onHandleUp = (e: any) => {
        if (this.#isOtherPointer(e)) {
            return false;
        }
        this._adapter.notifyMouseUp(e);
        handlePrevent(e);
        this.#unbindDragEvents();
        // a drag that was cut short by disabling the slider still has to end and report
        const wasDragging = this.getState('isDrag');
        this.setState({ isDrag: false, activeHandle: '' });
        if (this.getProp('disabled') && !wasDragging) {
            return false;
        }
        this.#notifyAfterChange();
        return true;
    };

    protected valueFormatIsCorrect(value: SliderProps['value']) {
        if (Array.isArray(value)) {
            return typeof value[0] === 'number' && typeof value[1] === 'number';
        } else {
            return typeof value === 'number';
        }
    }

    protected handleMousePos(clientX: number, clientY: number) {
        const parentRect = this.#getParentRect();
        const parentX = parentRect ? parentRect.left : 0;
        const parentY = parentRect ? parentRect.top : 0;
        return { x: clientX - parentX, y: clientY - parentY };
    }

    /**
     * Clamps a pointer position to the slider's start and end
     */
    protected checkMeetMinMax(position: number) {
        const { vertical, verticalReverse } = this._adapter.getProps();
        const direction = this._adapter.getContext('direction');
        const isRTL = direction === 'rtl' && !vertical;
        const { sliderX, sliderY, sliderWidth, sliderHeight } = this.#getSliderLengths();
        const len = vertical ? sliderHeight : sliderWidth;
        let startPos;
        if (vertical && verticalReverse) {
            startPos = sliderY + len;
        } else if (isRTL) {
            startPos = sliderX + len;
        } else {
            startPos = vertical ? sliderY : sliderX;
        }
        let endPos;
        if (vertical && verticalReverse) {
            endPos = sliderY;
        } else if (isRTL) {
            endPos = sliderX;
        } else {
            endPos = vertical ? sliderY + sliderHeight : sliderX + sliderWidth;
        }

        if ((vertical && verticalReverse) || isRTL) {
            if (position >= startPos) {
                position = startPos;
            } else if (position <= endPos) {
                position = endPos;
            }
        } else {
            if (position <= startPos) {
                position = startPos;
            } else if (position >= endPos) {
                position = endPos;
            }
        }
        return position;
    }

    /** Position to value snapped to step; false when nothing changes or the slider has no layout */
    protected transPosToValue(mousePos: number, isMin: boolean) {
        const pos = this.checkMeetMinMax(mousePos);
        const { currentValue } = this._adapter.getStates();
        const { range, vertical, step, verticalReverse, min, max } = this._adapter.getProps();
        const direction = this._adapter.getContext('direction');
        const isRTL = direction === 'rtl' && !vertical;
        const { sliderX, sliderY, sliderWidth, sliderHeight } = this.#getSliderLengths();
        const startPos = vertical ? sliderY : sliderX;
        const len = vertical ? sliderHeight : sliderWidth;
        // no layout (display: none) means no length to map onto
        if (!len) {
            return false;
        }
        let stepValue;
        if ((vertical && verticalReverse) || isRTL) {
            stepValue = ((startPos + len - pos) / len) * (max - min) + min;
        } else {
            stepValue = ((pos - startPos) / len) * (max - min) + min;
        }
        let compareValue;
        if (range) {
            compareValue = isMin ? currentValue[0] : currentValue[1];
        } else {
            compareValue = currentValue;
        }
        // steps count from min, as in the native range inputs; snapping first keeps a no-op move from being reported.
        // A step that is not positive is invalid for a native range and counts as 1.
        const stepSize = step > 0 ? step : 1;
        stepValue = this.normalizeValue(Math.round((stepValue - min) / stepSize) * stepSize + min) as number;
        // max need not be on the step grid; the native range stops at the last step below it
        if (stepValue > max) {
            stepValue = this.normalizeValue(stepValue - stepSize) as number;
        }
        if (range && stepValue !== compareValue) {
            return isMin ? [stepValue, currentValue[1]] : [currentValue[0], stepValue];
        } else if (!range && stepValue !== compareValue) {
            return stepValue;
        } else {
            return false;
        }
    }

    protected transValueToPos(value: SliderProps['value']) {
        const { vertical, range, verticalReverse, min, max } = this._adapter.getProps();
        const direction = this._adapter.getContext('direction');
        const isRTL = direction === 'rtl' && !vertical;
        const { sliderX, sliderY, sliderWidth, sliderHeight } = this.#getSliderLengths();

        const startPos = vertical ? sliderY : sliderX;
        const len = vertical ? sliderHeight : sliderWidth;

        const transSingle = (val: number) => {
            const percent = (val - min) / (max - min);
            if ((vertical && verticalReverse) || isRTL) {
                return startPos + len - percent * len;
            }
            return startPos + percent * len;
        };
        if (range) {
            return [transSingle(value[0]), transSingle(value[1])];
        } else {
            return transSingle(value as number);
        }
    }

    protected normalizeValue(inputValue: SliderProps['value']) {
        const { step, min } = this.getProps();
        return SliderFoundation.normalizeValue(step, min, this.getState('activeHandle'), inputValue);
    }

    protected calculateOutputValue(position: number, isMin: boolean): undefined | number | number[] {
        const moveValue = this.transPosToValue(position, isMin);
        if (moveValue === false) {
            return undefined;
        }
        return this.normalizeValue(moveValue);
    }

    protected checkWhichHandle(pagePos: number) {
        const { currentValue } = this._adapter.getStates();
        const currentPos = this.transValueToPos(currentValue);
        if (!Array.isArray(currentPos)) {
            return true;
        }
        return Math.abs(pagePos - currentPos[0]) <= Math.abs(pagePos - currentPos[1]);
    }

    static getInitialState(props: SliderProps): SliderState {
        // controlled by value, not by truthiness: value={0} is a controlled 0
        const value = props.value !== undefined ? props.value : props.defaultValue;
        return {
            currentValue: value ?? (props.range ? [props.min, props.min] : props.min),
            activeHandle: '',
            chooseMovePos: '',
            isDrag: false,
            showBoundary: false,
            isInRenderTree: true,
            focusVisibleHandle: '',
        };
    }

    /**
     * Percentages of the current value; they increase with value whatever the visual direction.
     */
    static getMinAndMaxPercent({ range, min, max }: SliderProps, value: SliderState['currentValue']) {
        const minPercent = range ? (value[0] - min) / (max - min) : ((value as number) - min) / (max - min);
        const maxPercent = range ? (value[1] - min) / (max - min) : 1;
        return { min: clamp(minPercent, 0, 1), max: clamp(maxPercent, 0, 1) };
    }

    /**
     * Whether each handle shows its tooltip, and the tooltip contents
     */
    static computeHandleVisibleVal({ tooltipVisible, tipFormatter: formatter, range, step, min }: SliderProps, { activeHandle, currentValue, isInRenderTree }: SliderState) {
        const visible = tooltipVisible && isInRenderTree;
        const output = (value: number) => SliderFoundation.normalizeValue(step, min, activeHandle, value) as number;
        const minValue = range ? output(currentValue[0]) : output(currentValue as number);
        const maxValue = range ? output(currentValue[1]) : null;
        const tipChildren = formatter ? { min: formatter(minValue), max: range ? formatter(maxValue) : null } : { min: minValue, max: maxValue };

        const tipVisible = { min: false, max: false };
        if (visible) {
            tipVisible.min = true;
            tipVisible.max = true;
        } else if (typeof visible === 'undefined' && formatter) {
            if (activeHandle === 'min') {
                tipVisible.min = true;
            } else if (activeHandle === 'max') {
                tipVisible.max = true;
            }
        }
        return { tipVisible, tipChildren };
    }

    /**
     * Whether a mark is highlighted: 'active' inside the included track, false outside min and max
     */
    static isMarkActive({ min, max, range, included }: SliderProps, currentValue: SliderState['currentValue'], mark: number) {
        if (mark >= min && mark <= max) {
            if (range) {
                return (mark > currentValue[1] || mark < currentValue[0]) && included ? 'unActive' : 'active';
            }
            return mark <= (currentValue as number) && included ? 'active' : 'unActive';
        }
        return false;
    }

    /**
     * Rounds to the larger decimal count of step and min; crossed range ends collapse onto the active handle's end
     */
    static normalizeValue(step: number, min: number, activeHandle: SliderState['activeHandle'], inputValue: SliderProps['value']) {
        // String(1e-7) is '1e-7', so the exponent counts against the fraction digits
        const countDecimals = (num: number) => {
            const [mantissa, exponent = '0'] = String(num).split('e');
            return Math.max(0, (mantissa.split('.')[1]?.length ?? 0) - Number(exponent));
        };
        const multipler = Math.pow(10, Math.max(countDecimals(step), countDecimals(min)));
        const transWay = (value: number) => Math.round(value * multipler) / multipler;

        if (Array.isArray(inputValue)) {
            const min = transWay(inputValue[0]);
            const max = transWay(inputValue[1]);
            if (min > max) {
                return activeHandle === 'min' ? [max, max] : [min, min];
            }
            return [min, max];
        }
        return transWay(inputValue);
    }

    /**
     * Range handles must not share one name and the wrapper has no role for a group label: aria-label gets the end
     * appended; aria-labelledby is followed by the handle itself (APG multi-thumb self-reference). A disabled handle
     * keeps the caller's name: the native disabled already tells the state, and a fallback aria-label would hide the
     * name a <label for> gives.
     */
    static getHandleA11y({ range, pos, id, ariaLabel, ariaLabelledby, generatedId, endName }: { range?: boolean; pos: 'min' | 'max'; id?: string; ariaLabel?: string; ariaLabelledby?: string; generatedId: string; endName: string }): {
        id?: string;
        ariaLabel?: string;
        ariaLabelledby?: string;
    } {
        const ownId = pos === 'min' ? id : undefined;
        const selfId = range && ariaLabelledby ? (ownId ?? `${generatedId}-${pos}`) : ownId;
        const label = !range ? ariaLabel : ariaLabelledby || !ariaLabel ? endName : `${ariaLabel} ${endName}`;
        return { id: selfId, ariaLabel: label, ariaLabelledby: range && ariaLabelledby ? `${ariaLabelledby} ${selfId}` : ariaLabelledby };
    }

    override init() {
        this.#checkCurrentValue();
        this.#dragOffset = 0;
    }

    override destroy() {
        this.#unbindDragEvents();
    }

    /** An event handler, so the tooltips follow a container that was hidden */
    syncIsInRenderTree = () => {
        const slider = this._adapter.getSliderNode();
        const isInRenderTree = Boolean(slider && (slider.offsetWidth || slider.offsetHeight || slider.getClientRects().length));
        if (isInRenderTree !== this.getState('isInRenderTree')) {
            this.setState({ isInRenderTree });
        }
    };

    /**
     * Syncs a changed value prop, clamped to min and max
     */
    handleValueChange(nextValue: SliderProps['value']) {
        if (!this.valueFormatIsCorrect(nextValue)) {
            return;
        }
        this.setState({ currentValue: this.#clampToRange(nextValue) });
    }

    /** A value prop back to undefined (a Form reset) returns to the default position */
    resetValue() {
        const { defaultValue, range, min } = this.getProps();
        const fallback = range ? [min, min] : min;
        this.setState({ currentValue: this.valueFormatIsCorrect(defaultValue) ? defaultValue : fallback });
        this.#checkCurrentValue();
    }

    onHandleDown(e: Pick<PointerEvent, 'pointerId' | 'pointerType' | 'button' | 'clientX' | 'clientY'> & { currentTarget: HTMLElement }, pos: 'min' | 'max') {
        if (isSecondaryPress(e)) {
            return false;
        }
        // bound even when disabled: the release still reports onMouseUp
        this.#bindDragEvents(e.pointerId);
        // moves and the release arrive outside the window; a scripted event has no active pointer (the browser throws)
        try {
            e.currentTarget?.setPointerCapture?.(e.pointerId);
        } catch {}
        const { vertical, disabled } = this.getProps();
        if (disabled) {
            return false;
        }
        this.setState({ isDrag: true, chooseMovePos: pos });

        const mousePos = this.handleMousePos(e.clientX, e.clientY);
        const pointerPos = vertical ? mousePos.y : mousePos.x;
        // the handle must not jump to the pointer
        this.#dragOffset = pointerPos - this.#getHandleCenterPosition(vertical, e.currentTarget);
        return true;
    }

    onHandleEnter(pos: SliderState['activeHandle']) {
        const { activeHandle } = this.getStates();
        if (!this.getProp('disabled') && !activeHandle && pos !== activeHandle) {
            this.setState({ activeHandle: pos });
        }
    }

    onHandleLeave() {
        if (!this.getState('isDrag')) {
            this.setState({ activeHandle: '' });
        }
    }

    /**
     * Both native inputs span min to max, so a range handle is stopped at the other one here
     */
    handleInputChange(value: number, pos: 'min' | 'max') {
        if (this.getProp('disabled')) {
            return;
        }
        const { currentValue } = this.getStates();
        let outputValue: number | number[] = value;
        if (Array.isArray(currentValue)) {
            outputValue = pos === 'min' ? [Math.min(value, currentValue[1]), currentValue[1]] : [currentValue[0], Math.max(value, currentValue[0])];
        }
        if (!isEqual(currentValue, outputValue)) {
            if (!this._isControlledComponent()) {
                this.setState({ currentValue: outputValue });
            }
            this._adapter.notifyChange(outputValue);
        }
    }

    /**
     * A value key stays with the slider unless the consumer's handler already prevented it. Page, Home and End keep
     * the native range's change; arrows step here, since engines map them differently over a vertical or RTL range
     * (Chrome follows the visual direction, Firefox not when vertical, Safari in neither case). The arrow pointing
     * towards max increases; the cross-axis arrow follows Up and Right.
     */
    handleKeyDown(event: Pick<KeyboardEvent, 'key' | 'defaultPrevented' | 'stopPropagation' | 'preventDefault' | KeyModifiers>, pos: 'min' | 'max') {
        if (event.defaultPrevented || !VALUE_KEYS.includes(event.key) || hasModifier(event)) {
            return;
        }
        event.stopPropagation();
        const { vertical, verticalReverse, step, min, max } = this.getProps();
        const toMax = vertical ? (verticalReverse ? 'ArrowUp' : 'ArrowDown') : this._adapter.getContext('direction') === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
        const increase = [toMax, vertical ? 'ArrowRight' : 'ArrowUp'];
        const opposite = { ArrowUp: 'ArrowDown', ArrowDown: 'ArrowUp', ArrowLeft: 'ArrowRight', ArrowRight: 'ArrowLeft' };
        const delta = increase.includes(event.key) ? 1 : increase.map((key) => opposite[key]).includes(event.key) ? -1 : 0;
        if (!delta) {
            return;
        }
        event.preventDefault();
        const { currentValue } = this.getStates();
        const value = Array.isArray(currentValue) ? currentValue[pos === 'min' ? 0 : 1] : currentValue;
        // as the native range: a non-positive step counts as 1, and a step past min or max is no change
        const next = this.normalizeValue(value + delta * (step > 0 ? step : 1)) as number;
        if (next >= min && next <= max) {
            this.handleInputChange(next, pos);
        }
    }

    /**
     * Releasing a value key ends the change, like releasing the mouse
     */
    handleKeyUp(event: Pick<KeyboardEvent, 'key' | KeyModifiers>) {
        if (VALUE_KEYS.includes(event.key) && !hasModifier(event)) {
            this.#onHandleUp(event);
        }
    }

    onFocus(e: { target: Element }, pos: 'min' | 'max') {
        const noTooltip = this.#noTooltip();
        if (noTooltip) {
            return;
        }
        if (e.target.matches(':focus-visible')) {
            this.setState({ focusVisibleHandle: pos });
        }
    }

    onBlur(pos: 'min' | 'max') {
        if (!this.#noTooltip() && this.getState('focusVisibleHandle') === pos) {
            this.setState({ focusVisibleHandle: '' });
        }
    }

    handleWrapClick = (e: any) => {
        if (this.getState('isDrag') || this.getProp('disabled')) {
            return;
        }
        const { vertical } = this.getProps();
        const mousePos = this.handleMousePos(e.clientX, e.clientY);
        const position = vertical ? mousePos.y : mousePos.x;
        const isMin = this.checkWhichHandle(position);

        const nextValue = this.calculateOutputValue(position, isMin);
        if (nextValue === undefined) {
            return;
        }
        this.#commitClick(nextValue);
    };

    /** A mark label is a wide target: it selects the mark's own value, not the value under the pointer */
    handleMarkClick(markValue: number) {
        if (this.getState('isDrag') || this.getProp('disabled')) {
            return;
        }
        const { range } = this.getProps();
        const currentValue = this.getState('currentValue');
        let nextValue = this.normalizeValue(markValue);
        if (range) {
            const [markPos] = this.transValueToPos([markValue, markValue]) as number[];
            const isMin = this.checkWhichHandle(markPos);
            nextValue = this.normalizeValue(isMin ? [markValue, currentValue[1]] : [currentValue[0], markValue]);
        }
        if (isEqual(this.normalizeValue(currentValue), nextValue)) {
            return;
        }
        this.#commitClick(nextValue);
    }

    handleWrapperEnter() {
        this.setState({ showBoundary: true });
    }

    handleWrapperLeave() {
        this.setState({ showBoundary: false });
    }
}
