import BaseFoundation, { type DefaultAdapter, type DirectionContext } from '../../base/foundation';
import { crossesFocusBoundary } from '../../utils/a11y';

export interface PinCodeBaseProps {
    disabled?: boolean;
    value?: string;
    format?: 'number' | 'mixed' | RegExp | ((value: string) => boolean);
    onChange?: (value: string) => void;
    defaultValue?: string;
    count?: number;
    autoFocus?: boolean;
    onComplete?: (value: string) => void;
}

export interface PinCodeBaseState {
    valueList: string[];
    currentActiveIndex: number;
}

export interface PinCodeAdapter<P extends PinCodeBaseProps = PinCodeBaseProps> extends DefaultAdapter<P, PinCodeBaseState, DirectionContext> {
    notifyValueChange: (values: string[]) => void;
    notifyComplete: (value: string) => void;
    changeSpecificInputFocusState: (index: number, state: 'blur' | 'focus') => void;
    /** Focus entering or leaving the whole code; Form injects `onBlur` */
    notifyFocus: (e: any) => void;
    notifyBlur: (e: any) => void;
}

export default class PinCodeFoundation<P extends PinCodeBaseProps = PinCodeBaseProps> extends BaseFoundation<PinCodeAdapter<P>, P, PinCodeBaseState> {
    static numberReg = /^\d*$/;
    static mixedReg = /^[0-9a-zA-Z]$/;
    static override readonly propKeys = ['value'];

    /** By code point, so a character outside the BMP is not split into two lone surrogates */
    static getInitialState(props: Pick<PinCodeBaseProps, 'value' | 'defaultValue'>): PinCodeBaseState {
        return { valueList: Array.from(props.value ?? props.defaultValue ?? ''), currentActiveIndex: 0 };
    }

    /** A value prop that goes back to undefined (a form reset) empties the cells */
    override handlePropsChange() {
        this.setState({ valueList: Array.from(this.getProp('value') ?? '') });
    }

    // moving between the cells is not entering or leaving the code: Form's blur validation waits until focus is outside
    handleFocus = (e: Parameters<typeof crossesFocusBoundary>[0]) => {
        if (crossesFocusBoundary(e)) {
            this.adapter.notifyFocus(e);
        }
    };

    handleBlur = (e: Parameters<typeof crossesFocusBoundary>[0]) => {
        if (crossesFocusBoundary(e)) {
            this.adapter.notifyBlur(e);
        }
    };

    handleCurrentActiveIndexChange = (index: number, state: 'focus' | 'blur') => {
        if (state === 'focus') {
            this.setState({ currentActiveIndex: index });
        }
    };

    async completeSingleInput(i: number, singleInputValue: string) {
        const isControlledComponent = this.isControlledComponent('value');
        // filled cells stay a prefix (the value is reported joined, so a gap would shift characters), hence typing
        // past its end lands on the first empty cell
        const index = Math.min(i, this.getState('valueList').length);
        // awaited after the commit, so a controlled paste reads the previous cell's character once the parent wrote it back
        await this.commitState({ currentActiveIndex: index + 1 });
        const valueList = [...this.getState('valueList')];
        valueList[index] = singleInputValue;
        this.adapter.notifyValueChange(valueList);
        if (!isControlledComponent) {
            await this.commitState({ valueList });
        }

        const count = this.getProp('count');
        if (index + 1 > count - 1) {
            this.adapter.changeSpecificInputFocusState(index, 'blur');
        } else {
            this.adapter.changeSpecificInputFocusState(index + 1, 'focus');
        }
        if (valueList.length === count) {
            this.adapter.notifyComplete(valueList.join(''));
        }
    }

    /** `data` is the InputEvent or CompositionEvent data of the change, if any */
    handleCellChange = (index: number, value: string, data?: string | null) => {
        if (value === '') {
            this.removeCell(index);
            return;
        }
        // The cell holds at most one character, so with the caret before it the value ends with the old character and
        // the typed one is `data`; a change without data (autofill) falls back to the end. By code point: an emoji is
        // two UTF-16 units but one character.
        const char = data && Array.from(data).length === 1 ? data : Array.from(value).at(-1);
        if (this.validateValue(char)) {
            void this.completeSingleInput(index, char);
        }
    };

    validateValue(value: string = '') {
        const format = this.getProp('format');
        let validateFunction = (_value: string) => true;
        if (typeof format === 'string') {
            if (format === 'number') {
                validateFunction = (value) => value.length === 0 || PinCodeFoundation.numberReg.test(value);
            } else if (format === 'mixed') {
                validateFunction = (value: string) => value.length === 0 || PinCodeFoundation.mixedReg.test(value);
            }
        } else if (format instanceof RegExp) {
            validateFunction = (value: string) => {
                // a g or y flag makes test() stateful across calls
                format.lastIndex = 0;
                return format.test(value);
            };
        } else if (typeof format === 'function') {
            validateFunction = format;
        }
        return validateFunction(value);
    }

    handlePaste = async (e: ClipboardEvent, startInputIndex: number) => {
        // before anything else, or the browser may paste first and write twice
        e.preventDefault();

        const textWillPaste = Array.from(e.clipboardData.getData('text'));
        const count = this.getProp('count');
        const start = Math.min(startInputIndex, this.getState('valueList').length);
        for (let i = start, charIndex = 0; i < count && charIndex < textWillPaste.length; i++, charIndex++) {
            const currentChar = textWillPaste[charIndex];
            if (this.validateValue(currentChar)) {
                await this.completeSingleInput(i, currentChar);
            } else {
                break;
            }
        }
    };

    /** Also covers a cell emptied without Backspace or Delete (cut, a virtual keyboard's delete). */
    removeCell(index: number) {
        const valueList = this.getState('valueList').toSpliced(index, 1);
        this.setState({ valueList });
        this.adapter.notifyValueChange(valueList);
    }

    handleKeyDownOnSingleInput = (e: KeyboardEvent, index: number) => {
        const lastIndex = this.getProp('count') - 1;
        if (e.key === 'Backspace') {
            this.removeCell(index);
            this.adapter.changeSpecificInputFocusState(Math.max(0, index - 1), 'focus');
            e.preventDefault();
        } else if (e.key === 'Delete') {
            this.removeCell(index);
            e.preventDefault();
        } else if (e.altKey || e.ctrlKey || e.metaKey) {
            // browser shortcuts such as Alt+ArrowLeft (back) keep their default action
            return;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const rtl = this.getContext('direction') === 'rtl';
            const forward = e.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
            this.adapter.changeSpecificInputFocusState(forward ? Math.min(lastIndex, index + 1) : Math.max(0, index - 1), 'focus');
            e.preventDefault();
        }
    };
}
