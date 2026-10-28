import BaseFoundation, { type DefaultAdapter, type DirectionContext } from '../base/foundation';

/** The members of a focus event the foundation reads; DOM events and React synthetic events both satisfy it */
export type RatingFocusEvent = { currentTarget: Node; relatedTarget: Node | null };

/**
 * The host's event types, which the foundation passes on to the callbacks: CE for a star click (mouse or keyboard),
 * FE for focus and blur of the list, KE for its keydown
 */
export interface RatingAdapter<P extends RatingBaseProps = RatingBaseProps, S extends RatingState = RatingState, CE = unknown, FE = unknown, KE = unknown> extends DefaultAdapter<P, S, DirectionContext> {
    /** Focuses the radio that stands for `value`; 0 is the empty star */
    focusStar: (value: number) => void;
    getStarDOM: (index: number) => Element | null;
    setHover: (hoverValue: number, clearedValue: number) => void;
    notifyHoverChange: (hoverValue: number) => void;
    setValue: (value: number) => void;
    notifyChange: (value: number) => void;
    setClearedValue: (clearedValue: number) => void;
    notifyClick: (e: CE, index: number) => void;
    notifyFocus: (e: FE) => void;
    notifyBlur: (e: FE) => void;
    notifyKeyDown: (e: KE) => void;
    setFocusVisibleStar: (index?: number) => void;
}

interface RatingValueProps {
    value?: number;
    defaultValue?: number;
}

export interface RatingItemModel {
    isHalf: boolean;
    isFull: boolean;
    firstWidth: string;
    firstValue: number;
    secondValue: number;
    setSize: number;
    firstTabIndex: number;
    secondTabIndex: number;
    secondPosInSet: number;
}

export interface RatingState {
    value: number;
    hoverValue: number;
    clearedValue: number;
    /** index of the star that holds keyboard focus */
    focusVisibleStar?: number;
}

/** The props the foundation reads with getProps */
export interface RatingBaseProps extends RatingValueProps {
    count?: number;
    allowHalf?: boolean;
    allowClear?: boolean;
    preventScroll?: boolean;
    autoFocus?: boolean;
    disabled?: boolean;
}

type RatingKeyEvent = Pick<KeyboardEvent, 'key' | 'preventDefault' | 'altKey' | 'ctrlKey' | 'metaKey'>;

export default class RatingFoundation<P extends RatingBaseProps = RatingBaseProps, S extends RatingState = RatingState, CE = unknown, FE extends RatingFocusEvent = RatingFocusEvent, KE extends RatingKeyEvent = RatingKeyEvent> extends BaseFoundation<RatingAdapter<P, S, CE, FE, KE>, P, S> {
    // StrictMode and React Activity replay init on this instance after destroy: autoFocus belongs to the first mount
    #initialized = false;

    #getOffsetLeft(el: Element) {
        return el.getBoundingClientRect().left + el.ownerDocument.defaultView.scrollX;
    }

    #changeHover(hoverValue: number, clearedValue: number) {
        this._adapter.setHover(hoverValue, clearedValue);
        this._adapter.notifyHoverChange(hoverValue);
    }

    #updateValue(value: number) {
        if (!this._isControlledComponent()) {
            this._adapter.setValue(value);
        }
        this._adapter.notifyChange(value);
    }

    protected getStarValue(index: number, pos: number) {
        const { allowHalf, count } = this.getProps();
        // the empty star stands for 0; it has no width, so a pointer never lands on it
        if (index === count) {
            return 0;
        }
        const direction = this._adapter.getContext('direction');
        const reverse = direction === 'rtl';
        let value = index + 1;
        if (allowHalf) {
            const starEle = this._adapter.getStarDOM(index);
            if (!starEle) {
                return value;
            }
            const leftDis = this.#getOffsetLeft(starEle);
            const width = starEle.clientWidth;
            if (reverse && pos - leftDis > width / 2) {
                value -= 0.5;
            } else if (!reverse && pos - leftDis < width / 2) {
                value -= 0.5;
            }
        }
        return value;
    }

    static getInitialState(props: RatingValueProps): RatingState {
        return {
            value: props.value === undefined ? props.defaultValue : props.value,
            hoverValue: undefined,
            clearedValue: null,
            focusVisibleStar: undefined,
        };
    }

    static deriveValue(props: RatingValueProps, state: Pick<RatingState, 'value'>) {
        return props.value === undefined ? state.value : props.value;
    }

    /** A value between radios (2.5 without allowHalf) has no checked radio; the first radio is then the Tab stop (APG) */
    static isRadioValue(value: number, count: number, allowHalf: boolean) {
        return value >= 0 && value <= count && Number.isInteger(allowHalf ? value * 2 : value);
    }

    /**
     * What a star's two radios (the first is the half, present only with allowHalf; the second is the whole star, or
     * the empty one at index === count) stand for, their ARIA position and Tab stops, and how much of the star is filled
     */
    static getItemModel({ index, count, allowHalf, value, displayValue, disabled, firstTabStop }: { index: number; count: number; allowHalf: boolean; value: number; displayValue: number; disabled: boolean; firstTabStop: boolean }): RatingItemModel {
        const isEmpty = index === count;
        const firstValue = index + 0.5;
        const secondValue = isEmpty ? 0 : index + 1;
        const diff = index + 1 - displayValue;
        return {
            isHalf: allowHalf && diff < 1 && diff > 0,
            isFull: diff <= 0,
            firstWidth: `${(1 - diff) * 100}%`,
            firstValue,
            secondValue,
            setSize: allowHalf ? count * 2 + 1 : count + 1,
            firstTabIndex: !disabled && (value === firstValue || firstTabStop) ? 0 : -1,
            secondTabIndex: !disabled && (value === secondValue || (firstTabStop && !allowHalf)) ? 0 : -1,
            secondPosInSet: allowHalf ? (isEmpty ? 2 * count + 1 : 2 * (index + 1)) : index + 1,
        };
    }

    /** Whether a focus on `value` belongs to the first (half) radio of the star at `index` */
    static isFirstRadio(value: number, index: number, allowHalf: boolean) {
        return allowHalf && value - index === 0.5;
    }

    /**
     * The value a click selects through the radio it hit, or undefined when it is an ordinary pointer click. Detail 0 is
     * a click without a pointer (a screen reader's default action, radio.click()): its coordinates mean nothing, so the
     * activated radio decides the value
     */
    static resolveClickRadio(detail: number, radioValue?: number): number | undefined {
        return detail === 0 ? radioValue : undefined;
    }

    /** What Enter or Space on a radio does: whether to `preventDefault` the key, and the value to select if any */
    static resolveKeyActivation(key: string, radioValue: number | undefined, value: number): { preventDefault: boolean; selectValue?: number } {
        const isSpace = key === ' ';
        if ((key !== 'Enter' && !isSpace) || radioValue === undefined) {
            return { preventDefault: false };
        }
        // Enter would also press a button that onChange moved focus to; Space would scroll the page. Space only checks
        // an unchecked radio (APG); Enter on the checked one clears it with allowClear
        return { preventDefault: true, selectValue: isSpace && radioValue === value ? undefined : radioValue };
    }

    /** A hovered star takes the tooltip from the focused one, so only one shows at a time */
    static isTipVisible(index: number, hoverValue?: number, focusVisibleStar?: number, tip?: string) {
        return (hoverValue === undefined ? focusVisibleStar === index : Math.ceil(hoverValue) - 1 === index) && Boolean(tip);
    }

    override init() {
        if (this.#initialized) {
            return;
        }
        this.#initialized = true;
        const { autoFocus, disabled } = this.getProps();
        if (autoFocus && !disabled) {
            this._adapter.focusStar(RatingFoundation.deriveValue(this.getProps(), this.getStates()));
        }
    }

    /** A value prop that goes back to undefined (a form reset) returns to defaultValue, like Slider (Switch and Checkbox become unchecked) */
    resetValue() {
        this._adapter.setValue(this.getProps().defaultValue);
    }

    handleHover(event: Pick<MouseEvent, 'pageX'>, index: number) {
        const currValue = this.getStarValue(index, event.pageX);
        const { clearedValue, hoverValue } = this.getStates();
        if (currValue !== hoverValue && currValue !== clearedValue) {
            this.#changeHover(currValue, null);
        }
    }

    handleMouseLeave() {
        this.#changeHover(undefined, null);
    }

    handleClick(event: CE & Pick<MouseEvent, 'pageX'>, index: number) {
        this.handleSelect(event, index, this.getStarValue(index, event.pageX));
    }

    /** Commits `newValue` for the star at `index`; selecting the current value clears it when allowClear is on */
    handleSelect(event: CE, index: number, newValue: number) {
        const { allowClear } = this.getProps();
        const value = RatingFoundation.deriveValue(this.getProps(), this.getStates());
        const isReset = allowClear ? newValue === value : false;
        this.#updateValue(isReset ? 0 : newValue);
        if (isReset) {
            this.#changeHover(undefined, newValue);
        } else {
            this._adapter.setClearedValue(null);
        }
        this._adapter.notifyClick(event, index);
    }

    handleFocus(e: FE) {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            this._adapter.notifyFocus(e);
        }
    }

    /** A radio of the star at `index` got focus; index === count is the empty star */
    handleStarFocus(e: { target: Element }, index: number) {
        // an arrow key moves focus between stars before the browser reports :focus-visible for the new one
        if (e.target.matches(':focus-visible') || this.getStates().focusVisibleStar !== undefined) {
            this._adapter.setFocusVisibleStar(index);
        }
    }

    handleBlur(e: FE) {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            this._adapter.notifyBlur(e);
            this._adapter.setFocusVisibleStar(undefined);
        }
    }

    handleKeyDown(event: KE, value: number) {
        // Alt, Ctrl and Meta combinations are browser shortcuts (Alt+ArrowLeft goes back), not value changes
        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }
        const { key } = event;
        const { count, allowHalf } = this.getProps();
        const direction = this._adapter.getContext('direction');
        const reverse = direction === 'rtl';
        const step = allowHalf ? 0.5 : 1;
        // a value between two radios (2.5 without allowHalf) moves to the adjacent radio
        const next = (Math.floor(value / step) + 1) * step;
        const previous = (Math.ceil(value / step) - 1) * step;
        let tempValue: number;
        let newValue: number;
        // APG radio group: Down and Right go to the next radio, Up and Left to the previous; only the horizontal
        // keys follow the writing direction
        if (key === 'ArrowRight') {
            tempValue = reverse ? previous : next;
        } else if (key === 'ArrowLeft') {
            tempValue = reverse ? next : previous;
        } else if (key === 'ArrowDown') {
            tempValue = next;
        } else if (key === 'ArrowUp') {
            tempValue = previous;
        }
        if (tempValue > count) {
            newValue = 0;
        } else if (tempValue < 0) {
            newValue = count;
        } else {
            newValue = tempValue;
        }
        if (['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown'].includes(key)) {
            this._adapter.notifyKeyDown(event);
            this.#updateValue(newValue);
            this._adapter.focusStar(newValue);
            event.preventDefault();
            this.#changeHover(undefined, null);
        }
    }
}
