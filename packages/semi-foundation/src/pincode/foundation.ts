import BaseFoundation, { type DefaultAdapter } from '../base/foundation';

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

export interface PinCodeAdapter<P extends PinCodeBaseProps = PinCodeBaseProps, S extends PinCodeBaseState = PinCodeBaseState> extends DefaultAdapter<P, S> {
    // the Promise must resolve after the commit and after a controlled parent wrote its value back:
    // completeSingleInput awaits it before reading valueList, so a controlled paste sees the previous cell's character
    onCurrentActiveIndexChange: (index: number) => Promise<void> | void;
    notifyValueChange: (values: string[]) => void;
    notifyComplete: (value: string) => void;
    changeSpecificInputFocusState: (index: number, state: 'blur' | 'focus') => void;
    updateValueList: (newValueList: PinCodeBaseState['valueList']) => Promise<void> | void;
}

export default class PinCodeFoundation<P extends PinCodeBaseProps = PinCodeBaseProps, S extends PinCodeBaseState = PinCodeBaseState> extends BaseFoundation<PinCodeAdapter<P, S>, P, S> {
    static numberReg = /^\d*$/;
    static mixedReg = /^[0-9a-zA-Z]$/;

    handleCurrentActiveIndexChange = (index: number, state: 'focus' | 'blur') => {
        if (state === 'focus') {
            void this.adapter.onCurrentActiveIndexChange(index);
        }
    };

    async completeSingleInput(i: number, singleInputValue: string) {
        const isControlledComponent = this.isControlledComponent('value');
        // filled cells stay a prefix (the value is reported joined, so a gap would shift characters), hence typing
        // past its end lands on the first empty cell
        const index = Math.min(i, this.getState('valueList').length);
        await this.adapter.onCurrentActiveIndexChange(index + 1);
        const valueList = [...this.getState('valueList')];
        valueList[index] = singleInputValue;
        this.adapter.notifyValueChange(valueList);
        if (!isControlledComponent) {
            await this.updateValueList(valueList);
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

    updateValueList = async (newValueList: PinCodeBaseState['valueList']) => {
        await this.adapter.updateValueList(newValueList);
    };

    handlePaste = async (e: ClipboardEvent, startInputIndex: number) => {
        // before anything else, or the browser may paste first and write twice
        e.preventDefault();

        // by code point, so a character outside the BMP is not split into lone surrogates
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

    /**
     * Removes the character and closes the gap. Also covers a cell emptied without Backspace or Delete (cut, a
     * virtual keyboard's delete).
     */
    removeCell(index: number) {
        const valueList = this.getState('valueList').toSpliced(index, 1);
        void this.updateValueList(valueList);
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
        } else if (e.key === 'ArrowLeft') {
            this.adapter.changeSpecificInputFocusState(Math.max(0, index - 1), 'focus');
            e.preventDefault();
        } else if (e.key === 'ArrowRight') {
            this.adapter.changeSpecificInputFocusState(Math.min(lastIndex, index + 1), 'focus');
            e.preventDefault();
        }
    };
}
