import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import arrayMove from '../utils/array-move';
import { fitInputWidth, onFontsLoaded, supportsFieldSizing } from '../utils/field-sizing';
import { isComposing } from '../utils/key-code';
import getSplitedArray from './utils/get-splited-array';

export type TagInputChangeEvent = Event;
export type TagInputCursorEvent = any;
export type TagInputKeyboardEvent = any;
export type TagInputMouseEvent = any;

export interface OnSortEndProps {
    oldIndex: number;
    newIndex: number;
}

/** The drag ids of the tags, with the sort not yet reflected in the value */
export interface TagSortIds {
    values: string[];
    ids: string[];
    move?: OnSortEndProps;
}

function sameTags(a: string[], b: string[]) {
    return a.length === b.length && a.every((value, index) => value === b[index]);
}

/** The props the foundation reads with getProps */
export interface TagInputBaseProps {
    value?: string[] | null;
    inputValue?: string;
    disabled?: boolean;
    maxLength?: number;
    max?: number;
    allowDuplicates?: boolean;
    addOnBlur?: boolean;
    separator?: string | string[] | null;
    split?: (originString: string, separators: string | string[] | null) => string[];
}

export interface TagInputBaseState {
    tagsArray?: string[];
    inputValue?: string;
    focusing?: boolean;
    active?: boolean;
    entering?: boolean;
}

export interface TagInputAdapter<P extends TagInputBaseProps = TagInputBaseProps, S extends TagInputBaseState = TagInputBaseState, E = TagInputChangeEvent> extends DefaultAdapter<P, S> {
    setInputValue: (inputValue: string) => void;
    setTagsArray: (tagsArray: string[]) => void;
    setFocusing: (focusing: boolean) => void;
    toggleFocusing(focused: boolean): void;
    setActive: (active: boolean) => void;
    setEntering: (entering: boolean) => void;
    notifyBlur: (e: TagInputCursorEvent) => void;
    notifyFocus: (e: TagInputCursorEvent) => void;
    notifyInputChange: (v: string, e: E) => void;
    notifyTagChange: (v: string[]) => void;
    notifyTagAdd: (v: string[]) => void;
    notifyTagRemove: (v: string, idx: number) => void;
    notifyKeyDown: (e: TagInputMouseEvent) => void;
    notifyInputExceed: (value: string) => void;
    notifyExceed: (tagList: string[]) => void;
    getInput(): HTMLInputElement | null;
}

export default class TagInputFoundation<P extends TagInputBaseProps = TagInputBaseProps, S extends TagInputBaseState = TagInputBaseState, E = TagInputChangeEvent> extends BaseFoundation<TagInputAdapter<P, S, E>, P, S> {
    // the browser lacks CSS field-sizing, so the input width is written inline
    #fitInline = false;

    #current() {
        const props = this.getProps();
        const state = this.getStates();
        return {
            tagsArray: TagInputFoundation.getTagsArray(props, state),
            inputValue: TagInputFoundation.getInputValue(props, state),
        };
    }

    #splitArray(originString: string, separators: string | string[] | null) {
        const { split } = this.getProps();
        if (typeof split === 'function') {
            return split(originString, separators);
        }
        return getSplitedArray(originString, separators);
    }

    #checkInputChangeValid(value: string) {
        const { maxLength, separator } = this._adapter.getProps();
        const { inputValue } = this.#current();
        let allowChange = true;
        if (typeof maxLength === 'number') {
            const valueArr = this.#splitArray(value, separator);
            const inputArr = this.#splitArray(inputValue, separator);
            const maxLen = Math.max(valueArr.length, inputArr.length);
            for (let i = 0; i < maxLen; i++) {
                if (valueArr[i] !== undefined && (inputArr[i] === undefined || valueArr[i].length > inputArr[i].length)) {
                    if (valueArr[i].length > maxLength) {
                        allowChange = false;
                        this._adapter.notifyInputExceed(value);
                        break;
                    }
                }
            }
        }
        return allowChange;
    }

    #handleAddTags(e: E) {
        const { separator, max, allowDuplicates } = this._adapter.getProps();
        const { inputValue, tagsArray } = this.#current();
        let addTags = this.#splitArray(inputValue, separator);

        addTags = addTags.filter((item, idx) => {
            if (!allowDuplicates) {
                if (tagsArray.includes(item) || addTags.indexOf(item) !== idx) {
                    return false;
                }
            }
            return typeof item === 'string' && item.trim() !== '';
        });
        let newTagList = tagsArray.concat(addTags);
        if (typeof max === 'number' && newTagList.length > max) {
            this._adapter.notifyExceed(newTagList);
            // fill only the room left; tags already past max stay
            addTags = addTags.slice(0, Math.max(0, max - tagsArray.length));
            newTagList = tagsArray.concat(addTags);
        }
        if (addTags.length > 0) {
            this.#onAdd(newTagList, addTags);
        }
        this.#onInputChange('', e);
    }
    #onRemove(newTagList: string[], removedTags: string, index: number) {
        if (!this._isControlledComponent()) {
            this._adapter.setTagsArray(newTagList);
        }
        this._adapter.notifyTagChange(newTagList);
        this._adapter.notifyTagRemove(removedTags, index);
    }

    #onAdd(newTagList: string[], addTags: string[]) {
        if (!this._isControlledComponent()) {
            this._adapter.setTagsArray(newTagList);
        }
        this._adapter.notifyTagChange(newTagList);
        this._adapter.notifyTagAdd(addTags);
    }

    #onInputChange(value: string, e: E) {
        this._adapter.setInputValue(value);
        this._adapter.notifyInputChange(value, e);
    }

    /** A controlled `value` wins over state, and a controlled `null` means no tags */
    static getTagsArray(props: { value?: string[] | null }, state: { tagsArray?: string[] }) {
        if (props.value !== undefined) {
            return props.value ?? [];
        }
        return state.tagsArray;
    }

    /**
     * Drag ids that stay with their tags. Numbering equal tags by occurrence would swap ids when a dragged tag passes
     * an equal one and remount it, so a tag keeps the id of an equal tag in `prev`, in order. A new tag takes the
     * lowest free `${n}:${value}`, and a pending `move` carries the ids along once the value shows that sort. Equal
     * values return `prev` itself, so a caller can skip the update and an untaken sort stays pending.
     */
    static getSortIds(values: string[], prev?: TagSortIds): TagSortIds {
        if (prev?.move) {
            const { oldIndex, newIndex } = prev.move;
            if (sameTags(values, arrayMove(prev.values, oldIndex, newIndex))) {
                return { values, ids: arrayMove(prev.ids, oldIndex, newIndex) };
            }
        }
        if (prev && sameTags(values, prev.values)) {
            return prev;
        }
        const unused = new Map<string, string[]>();
        prev?.values.forEach((value, index) => unused.set(value, [...(unused.get(value) ?? []), prev.ids[index]]));
        const taken = new Set(prev?.ids);
        const newId = (value: string) => {
            let n = 0;
            while (taken.has(`${n}:${value}`)) {
                n++;
            }
            taken.add(`${n}:${value}`);
            return `${n}:${value}`;
        };
        return { values, ids: values.map((value) => unused.get(value)?.shift() ?? newId(value)) };
    }

    /** The input text on screen: a string `inputValue` prop wins over state */
    static getInputValue(props: { inputValue?: string }, state: { inputValue?: string }) {
        return typeof props.inputValue === 'string' ? props.inputValue : state.inputValue;
    }

    override init() {
        // decided after mount, so the server and the first client render agree
        this.#fitInline = !supportsFieldSizing();
        if (this.#fitInline) {
            onFontsLoaded(() => this.fitInputWidth(), this.signal);
            this.fitInputWidth();
        }
    }

    override destroy() {
        this.#fitInline = false;
    }

    /** Re-fits the inline input width without field-sizing; hosts call it when the typed text changes */
    fitInputWidth() {
        const input = this.#fitInline ? this._adapter.getInput() : null;
        if (input) {
            fitInputWidth(input);
        }
    }

    handleInputChange(value: string, e: E) {
        const { entering } = this.getStates();
        if (entering) {
            // IME text is not final: handleInputCompositionEnd validates the committed result
            this.#onInputChange(value, e);
        } else if (this.#checkInputChangeValid(value)) {
            this.#onInputChange(value, e);
        }
    }

    handleInputCompositionStart = (_e: any) => {
        const { maxLength } = this.getProps();
        if (typeof maxLength !== 'number') {
            return;
        }
        this._adapter.setEntering(true);
    };

    handleInputCompositionEnd = (e: any) => {
        const { value } = e.target;
        const { maxLength, separator } = this.getProps();
        if (typeof maxLength !== 'number') {
            return;
        }
        this._adapter.setEntering(false);
        let allowChange = true;
        const inputArr = this.#splitArray(value, separator);
        let index = 0;
        for (; index < inputArr.length; index++) {
            if (inputArr[index].length > maxLength) {
                allowChange = false;
                this._adapter.notifyInputExceed(value);
                break;
            }
        }
        if (!allowChange) {
            const newInputArr = inputArr.slice(0, index);
            if (index < inputArr.length) {
                newInputArr.push(inputArr[index].slice(0, maxLength));
            }
            // getSplitedArray splits on the first separator, so that one joins the parts back
            // #onInputChange keeps a controlled inputValue and onInputChange in step with the truncation
            this.#onInputChange(newInputArr.join(Array.isArray(separator) ? separator[0] : separator), e);
        } else {
            // Firefox does not fire onChange after the composition ends, so the value is set here
            this._adapter.setInputValue(value);
        }
    };

    handleKeyDown = (e: TagInputKeyboardEvent) => {
        const { inputValue, tagsArray } = this.#current();
        const key = isComposing(e) ? '' : e.key;
        if (key === 'Enter') {
            e.preventDefault(); // keeps a form from submitting
            if (inputValue !== '') {
                this.#handleAddTags(e);
            }
        }
        const { length } = tagsArray;
        if (key === 'Backspace' && inputValue === '' && length > 0) {
            const newTagList = tagsArray.slice(0, length - 1);
            const removedTag = tagsArray[length - 1];
            this.#onRemove(newTagList, removedTag, length - 1);
        }
        this._adapter.notifyKeyDown(e);
    };

    handleInputBlur(e: TagInputCursorEvent) {
        const { addOnBlur } = this._adapter.getProps();
        if (addOnBlur === true && this.#current().inputValue !== '') {
            this.#handleAddTags(e);
        }
        // focus left the TagInput: a click-started session must not outlive it, or the focus style, expanded tags and
        // drag handles stay until a later mousedown elsewhere
        this.deactivate();
        this._adapter.setFocusing(false);
        this._adapter.notifyBlur(e);
    }

    handleInputFocus(e: TagInputCursorEvent) {
        // Tab entry gets the same state as a click
        this.handleClick();
        this._adapter.setFocusing(true);
        this._adapter.notifyFocus(e);
    }

    handleClearBtn(e: TagInputMouseEvent) {
        const { inputValue, tagsArray } = this.#current();
        if (tagsArray.length > 0) {
            if (!this._isControlledComponent()) {
                this._adapter.setTagsArray([]);
            }
            this._adapter.notifyTagChange([]);
        }
        if (inputValue.length > 0) {
            this.#onInputChange('', e);
        }
        // keeps the click from reaching the TagInput root
        e.stopPropagation();
    }

    handleTagClose(index: number) {
        const { tagsArray } = this.#current();
        const newTagList = [...tagsArray];
        newTagList.splice(index, 1);
        const removedTag = tagsArray[index];
        this.#onRemove(newTagList, removedTag, index);
    }

    handleClick() {
        const { disabled } = this.getProps();
        if (disabled) {
            return;
        }
        if (!this.getState('active')) {
            this._adapter.setActive(true);
        }
    }

    /** Ends the active session started by a click: on a mousedown outside the TagInput, or on blur() */
    deactivate() {
        this._adapter.setActive(false);
    }

    handleClickPrefixOrSuffix() {
        const { disabled } = this._adapter.getProps();
        const { focusing } = this._adapter.getStates();
        if (!disabled && !focusing) {
            this._adapter.toggleFocusing(true);
        }
    }

    handleSortEnd({ oldIndex, newIndex }: OnSortEndProps) {
        const { tagsArray } = this.#current();
        const newTagsArray = arrayMove(tagsArray, oldIndex, newIndex);
        if (!this._isControlledComponent()) {
            this._adapter.setTagsArray(newTagsArray);
        }
        this._adapter.notifyTagChange(newTagsArray);
    }
}
