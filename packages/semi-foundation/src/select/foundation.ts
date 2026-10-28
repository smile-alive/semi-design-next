import { isEqual } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { getEnabledStepIndex, getListTargetIndex, handlePrevent, isInnerControlActivation, isInnerControlKey, isTextEditor, Typeahead } from '../utils/a11y';
import EventEmitter from '../utils/event';
import FocusTrapHandle from '../utils/focus-handle';
import { ENTER_KEY, isComposing } from '../utils/key-code';
import warning from '../utils/warning';
import { strings } from './constants';
import type { BasicOptionProps } from './option-foundation';

/** The props the foundation reads with getProps */
export interface SelectBaseProps {
    allowCreate?: boolean;
    autoClearSearchValue?: boolean;
    autoFocus?: boolean;
    clickToHide?: boolean;
    defaultActiveFirstOption?: boolean;
    defaultOpen?: boolean;
    defaultValue?: unknown;
    disabled?: boolean;
    ellipsisTrigger?: boolean;
    // method syntax keeps the option parameter bivariant: the component's OptionProps label is narrower
    filter?: boolean | { filter(inputValue: string, option: BasicOptionProps): boolean }['filter'];
    loading?: boolean;
    maxTagCount?: number;
    multiple?: boolean;
    onChangeWithObject?: boolean;
    remote?: boolean;
    searchPosition?: 'trigger' | 'dropdown';
    value?: unknown;
}

export interface SelectBaseState {
    focusIndex: number;
    inputValue: string;
    isFocus: boolean;
    isFullTags: boolean;
    isOpen: boolean;
    options: BasicOptionProps[];
    selections: Map<any, any>;
    showInput: boolean;
}

/** LE is the host's option list scroll event, which the foundation only passes through */
export interface SelectAdapter<P extends SelectBaseProps = SelectBaseProps, S extends SelectBaseState = SelectBaseState, LE = unknown> extends DefaultAdapter<P, S> {
    updateFocusState(focus: boolean): void;
    focusTrigger(): void;
    getOptionsFromChildren(): BasicOptionProps[];
    updateOptions(options: BasicOptionProps[]): void;
    updateFocusIndex(index: number): void;
    updateSelection(selection: Map<any, any>): void;
    openMenu(cb?: () => void): void;
    notifyDropdownVisibleChange(visible: boolean): void;
    toggleInputShow(show: boolean, cb: () => void): void;
    closeMenu(): void;
    notifyCreate(option: BasicOptionProps): void;
    getMaxLimit(): number;
    getSelections(): Map<any, any>;
    notifyMaxLimit(arg: BasicOptionProps): void;
    notifyClear(): void;
    updateInputValue(inputValue: string): void;
    focusInput(): void;
    focusDropdownInput(): void;
    notifySearch(inputValue: string, event?: any): void;
    notifyChange(value: string | BasicOptionProps | (string | BasicOptionProps)[]): void;
    notifySelect(value: BasicOptionProps['value'], option: BasicOptionProps): void;
    notifyDeselect(value: BasicOptionProps['value'], option: BasicOptionProps): void;
    notifyBlur(event: any): void;
    notifyFocus(event: any): void;
    notifyListScroll(event: LE): void;
    notifyMouseLeave(event: any): void;
    notifyMouseEnter(event: any): void;
    updateScrollTop(index?: number): void;
    updateOverflowItemCount(count: number): void;
    getOptionList(): any;
    setIsFocusInContainer(isFocusInContainer: boolean): void;
    getIsFocusInContainer(): boolean;
}

type LabelValue = string | number;
type PropValue = LabelValue | Record<string, any>;
export default class SelectFoundation<P extends SelectBaseProps = SelectBaseProps, S extends SelectBaseState = SelectBaseState, LE = unknown> extends BaseFoundation<SelectAdapter<P, S, LE>, P, S> {
    // isFocus cannot tell whether onBlur is owed: a Tab into the trigger leaves it unset (clicked style)
    #blurPending = false;
    // StrictMode and React Activity replay init on this instance after destroy, over a dropdown and focus the user
    // may have changed since: defaultOpen and autoFocus belong to the first mount
    #initialized = false;
    readonly #typeahead = new Typeahead();
    // close() defers clearing the search to the end of the leave animation, which the host reports as popoverClose
    readonly #events = new EventEmitter();

    static #resolveSelections(props: SelectBaseProps, propValue: PropValue, originalOptions: BasicOptionProps[], nowSelections: Map<any, any>) {
        return props.multiple ? SelectFoundation.#resolveMultiple(props, propValue as PropValue[], originalOptions, nowSelections) : SelectFoundation.#resolveSingle(props, propValue, originalOptions);
    }

    static #firstEnabledIndex(options: BasicOptionProps[]) {
        return options.filter((option) => option._show).findIndex((option) => !option.disabled);
    }

    static #markSelected({ allowCreate }: SelectBaseProps, selections: Map<any, any>, options: BasicOptionProps[]) {
        return options.map((option) => {
            if (selections.has(option.value)) {
                if (allowCreate) {
                    const { _inputCreateOnly, ...rest } = option;
                    return { ...rest, _selected: true };
                }
                return { ...option, _selected: true };
            }
            if (option._inputCreateOnly) {
                return { ...option, _show: false, _selected: false };
            }
            return { ...option, _selected: false };
        });
    }

    static #resolveSingle({ onChangeWithObject }: SelectBaseProps, propValue: PropValue, originalOptions: BasicOptionProps[]) {
        const selections = new Map();

        // with onChangeWithObject the value prop is an option object
        const selectedValue = onChangeWithObject ? (propValue as BasicOptionProps)?.value : propValue;
        const selectedOptions = originalOptions.filter((option) => option.value === selectedValue);

        const noMatchOptionInList = !selectedOptions.length && typeof selectedValue !== 'undefined' && selectedValue !== null;

        if (selectedOptions.length) {
            const selectedOption = selectedOptions[0];
            const optionExist = { ...selectedOption };
            selections.set(optionExist.value, optionExist);
        } else if (noMatchOptionInList) {
            let optionNotExist = {
                value: propValue,
                label: propValue,
                _notExist: true,
                _scrollIndex: -1,
            } as BasicOptionProps;
            if (onChangeWithObject) {
                optionNotExist = { ...(propValue as BasicOptionProps), _notExist: true, _scrollIndex: -1 };
            }
            selections.set(optionNotExist.value, optionNotExist);
        }
        return selections;
    }

    static #resolveMultiple({ onChangeWithObject }: SelectBaseProps, propValue: PropValue[], originalOptions: BasicOptionProps[], nowSelections: Map<any, any>) {
        let selectedOptionList: any[] = [];
        const propValueIsArray = Array.isArray(propValue);
        warning(propValue != null && !propValueIsArray, '[Semi Select] defaultValue/value should be array type in multiple mode');
        if (nowSelections.size) {
            selectedOptionList = [...nowSelections].map((item) => item[1]);
        }

        const selections = new Map();
        let selectedValues = propValue;

        // dropping empty slots keeps object indexes aligned with the values
        let selectedObjects: BasicOptionProps[] = [];
        if (onChangeWithObject && propValueIsArray) {
            selectedObjects = (propValue as BasicOptionProps[]).filter(Boolean);
            selectedValues = selectedObjects.map((item) => item.value);
        }

        if (propValueIsArray && selectedValues.length) {
            (selectedValues as LabelValue[]).forEach((selectedValue, i: number) => {
                const index = originalOptions.findIndex((option) => option.value === selectedValue);
                if (index !== -1) {
                    selections.set(selectedValue, originalOptions[index]);
                } else {
                    const indexInSelectedList = selectedOptionList.findIndex((option) => option.value === selectedValue);
                    if (indexInSelectedList !== -1) {
                        const option = selectedOptionList[indexInSelectedList];
                        if (onChangeWithObject) {
                            const optionCompare = { ...selectedObjects[i] };
                            selections.set(selectedValue, isEqual(optionCompare, option) ? option : optionCompare);
                        } else {
                            selections.set(selectedValue, option);
                        }
                    } else {
                        let optionNotExist: BasicOptionProps = {
                            value: selectedValue,
                            label: selectedValue,
                            _notExist: true,
                        };
                        if (onChangeWithObject) {
                            optionNotExist = { ...selectedObjects[i], _notExist: true };
                        }
                        selections.set(selectedValue, { ...optionNotExist, _scrollIndex: -1 });
                    }
                }
            });
        }

        return selections;
    }

    #focusTrigger() {
        this._adapter.focusTrigger();
    }

    #update(propValue: PropValue, originalOptions: BasicOptionProps[]) {
        const selections = SelectFoundation.#resolveSelections(this.getProps(), propValue, originalOptions, this.getState('selections'));
        if (this.#isMultiple()) {
            this.updateOverflowItemCount(selections.size);
        }
        this._adapter.updateSelection(selections);
        this.#updateOptionsActiveStatus(selections, originalOptions);
    }

    #isMultiple() {
        return this.getProp('multiple');
    }

    #isDisabled() {
        return this.getProp('disabled');
    }

    #isFilterable() {
        return Boolean(this.getProp('filter'));
    }

    #handleSingleSelect({ value, label, ...rest }: BasicOptionProps, event: MouseEvent | KeyboardEvent) {
        const selections = new Map().set(value, { value, label, ...rest });
        this.#notifySelect(value, { value, label, ...rest });
        // option updates wait for the close animation, or the visible popup flashes
        const isFilterable = this.#isFilterable();

        if (this._isControlledComponent()) {
            this.close({
                event: event,
                notToggleInput: true,
                closeCb: () => {
                    this.#notifyChange(selections);
                    // after updateSelection, or the inactive DOM text updates first and flashes
                    if (isFilterable) {
                        this.#toggle2SearchInput(false);
                    }
                },
            });
        } else {
            // before writing: #notifyChange diffs against the selections in state
            this.#notifyChange(selections);
            this._adapter.updateSelection(selections);

            this.close({
                event: event,
                closeCb: () => {
                    this.#updateOptionsActiveStatus(selections);
                },
            });
        }
    }

    #handleMultipleSelect({ value, label, ...rest }: BasicOptionProps, event: MouseEvent | KeyboardEvent) {
        const maxLimit = this._adapter.getMaxLimit();
        const selections = this._adapter.getSelections();
        const { autoClearSearchValue } = this.getProps();
        if (selections.has(value)) {
            this.#notifyDeselect(value, { value, label, ...rest });
            selections.delete(value);
        } else if (maxLimit && selections.size >= maxLimit) {
            this._adapter.notifyMaxLimit(this.#removeInternalKey({ value, label, ...rest }));
            return;
        } else {
            this.#notifySelect(value, { value, label, ...rest });
            selections.set(value, { value, label, ...rest });
        }
        if (this._isControlledComponent()) {
            this.#notifyChange(selections);
            if (this.#isFilterable()) {
                if (autoClearSearchValue) {
                    this.clearInput(event);
                }
                this.#focusInput();
            }
        } else {
            // before writing: #notifyChange diffs against the selections in state
            this.#notifyChange(selections);
            this._adapter.updateSelection(selections);
            this.updateOverflowItemCount(selections.size);
            let { options } = this.getStates();
            if (this.#isFilterable()) {
                if (autoClearSearchValue) {
                    this.clearInput(event);
                    const sugInput = '';
                    options = this.#filterOption(options, sugInput);
                }
                this.#focusInput();
            }
            this.#updateOptionsActiveStatus(selections, options);
        }
    }

    #filterOption(originalOptions: BasicOptionProps[], sugInput: string) {
        const filter = this.getProp('filter');
        if (!filter) {
            return originalOptions;
        } else if (typeof filter === 'function') {
            return originalOptions.map((option) => ({ ...option, _show: Boolean(filter(sugInput, option)) }));
        }
        const input = sugInput.toLowerCase();

        return originalOptions.map((option) => {
            // entries may carry only a value, and a node label has no text to match
            const label = option.label ?? option.value;
            const text = typeof label === 'string' || typeof label === 'number' ? String(label).toLowerCase() : '';
            const groupLabel = option._parentGroup && option._parentGroup.label;
            const matchOption = text.includes(input);
            const matchGroup = (typeof groupLabel === 'string' || typeof groupLabel === 'number') && String(groupLabel).toLowerCase().includes(input);
            return { ...option, _show: matchOption || matchGroup };
        });
    }

    #createOptionByInput(allowCreate: boolean, optionsAfterFilter: BasicOptionProps[], sugInput: string) {
        if (allowCreate) {
            if (sugInput) {
                const newOptionByInput = {
                    _show: true,
                    _selected: false,
                    value: sugInput,
                    label: sugInput,
                    _inputCreateOnly: true,
                };

                let createOptionIndex = -1;
                let matchOptionIndex = -1;
                optionsAfterFilter = optionsAfterFilter.map((option, index) => {
                    if (!option._show && !option._inputCreateOnly) {
                        return option;
                    }
                    if (option.label === sugInput) {
                        matchOptionIndex = index;
                    }
                    if (option._inputCreateOnly) {
                        createOptionIndex = index;
                        return { ...option, value: sugInput, label: sugInput, _show: true };
                    }
                    return option;
                });

                if (createOptionIndex === -1 && matchOptionIndex === -1) {
                    optionsAfterFilter = [...optionsAfterFilter, newOptionByInput];
                }
                if (matchOptionIndex !== -1) {
                    optionsAfterFilter = optionsAfterFilter.filter((item) => !item._inputCreateOnly);
                }
            } else {
                optionsAfterFilter = optionsAfterFilter.filter((item) => !item._inputCreateOnly);
            }
        }
        // Known limit: creation is synchronous; an async (Promise) creation hook is unsupported.
        return optionsAfterFilter;
    }

    #setFocusIndex(index: number) {
        this._adapter.updateFocusIndex(index);
        if (index !== -1) {
            this._adapter.updateScrollTop(index);
        }
    }

    #moveFocus(offset: number) {
        const { focusIndex, options } = this.getStates();
        const visibleOptions = options.filter((item: BasicOptionProps) => item._show);
        this.#setFocusIndex(getEnabledStepIndex(offset, focusIndex, visibleOptions.length, (i) => visibleOptions[i].disabled));
    }

    #selectedIndex(options: BasicOptionProps[]) {
        const selections = this.getState('selections');
        return options.filter((option) => option._show).findIndex((option) => selections.has(option.value));
    }

    // APG: the highlight starts on the selected option; returns whether one is shown
    #focusSelectedOption(options: BasicOptionProps[]) {
        const index = this.#selectedIndex(options);
        if (index !== -1) {
            this.#setFocusIndex(index);
        }
        return index !== -1;
    }

    /**
     * APG select-only combobox: Space opens the list or acts like Enter; Home and End open it and go to the first and
     * last enabled option; typed characters open it and go to the next label starting with them. Returns whether the
     * key was used.
     */
    #handleSelectOnlyKeyDown(event: KeyboardEvent) {
        const { key } = event;
        const isTypeahead = this.#typeahead.accepts(event);
        if (!isTypeahead && key !== ' ' && key !== 'Home' && key !== 'End') {
            return false;
        }
        event.preventDefault();
        // before open(), which updates the state at once: the Space that opens must not also select
        const wasOpen = this.getState('isOpen');
        if (key === ' ' && !isTypeahead) {
            if (wasOpen) {
                this.#handleEnterKeyDown(event);
            } else {
                this.open();
            }
            return true;
        }
        if (!wasOpen) {
            this.open();
        }
        const { focusIndex, options } = this.getStates();
        const visibleOptions = options.filter((option) => option._show);
        let index: number | null;
        if (isTypeahead) {
            const labels = visibleOptions.map((option) => {
                const label = option.label ?? option.value;
                return !option.disabled && (typeof label === 'string' || typeof label === 'number') ? String(label) : '';
            });
            index = this.#typeahead.match(key, labels, focusIndex);
        } else {
            index = getListTargetIndex(key, focusIndex, visibleOptions.length, (i) => visibleOptions[i].disabled);
        }
        if (index !== null && index !== -1) {
            this.#setFocusIndex(index);
        }
        return true;
    }

    #handleArrowKeyDown(offset: number) {
        const { isOpen } = this.getStates();
        if (isOpen) {
            this.#moveFocus(offset);
        } else {
            this.open();
        }
    }

    // the key alone does not tell whether focus leaves the Select (clear button and tags are inside), so blur notifies
    #handleTabKeyDown(event: Pick<KeyboardEvent, 'shiftKey' | 'preventDefault' | 'stopPropagation'>) {
        const { isOpen } = this.getStates();

        if (isOpen) {
            const focusableElements = FocusTrapHandle.getFocusableElements(this._adapter.getOptionList());
            const focusableNum = focusableElements.length;

            if (focusableNum > 0) {
                if (event.shiftKey) {
                    this.#handlePanelOpenShiftTabKeyDown(focusableElements, event);
                } else {
                    this.#handlePanelOpenTabKeyDown(focusableElements, event);
                }
            } else {
                this.close({ event: event });
            }
        }
    }

    #getActiveElement() {
        return FocusTrapHandle.getActiveElement(this._adapter.getOptionList());
    }

    #handlePanelOpenTabKeyDown(focusableElements: any[], event: any) {
        const activeElement = this.#getActiveElement();
        const isFocusInContainer = this._adapter.getIsFocusInContainer();
        if (!isFocusInContainer) {
            focusableElements[0].focus();
            this._adapter.setIsFocusInContainer(true);
            handlePrevent(event);
        } else if (activeElement === focusableElements.at(-1)) {
            this.#focusTrigger();
            this.close({ event });
            handlePrevent(event);
        }
    }

    #handlePanelOpenShiftTabKeyDown(focusableElements: any[], event: any) {
        const activeElement = this.#getActiveElement();
        const isFocusInContainer = this._adapter.getIsFocusInContainer();

        if (!isFocusInContainer) {
            this.close({ event });
        } else if (activeElement === focusableElements[0]) {
            this.#focusTrigger();
            this._adapter.setIsFocusInContainer(false);
            handlePrevent(event);
        }
    }

    #handleEnterKeyDown(event: KeyboardEvent) {
        const { isOpen, options, focusIndex } = this.getStates();
        if (!isOpen) {
            this.open();
        } else {
            if (focusIndex !== -1) {
                const visibleOptions = options.filter((item: BasicOptionProps) => item._show);
                const { length } = visibleOptions;
                // stale after the visible options shrink
                if (length <= focusIndex) {
                    return;
                }
                if (visibleOptions && length) {
                    const selectedOption = visibleOptions[focusIndex];
                    if (selectedOption.disabled) {
                        return;
                    }
                    this.onSelect(selectedOption, focusIndex, event);
                }
            } else {
                this.close({ event });
            }
        }
    }

    #handleBackspaceKeyDown() {
        if (this.#isMultiple()) {
            const selections = this._adapter.getSelections();
            const { inputValue } = this.getStates();
            const length = selections.size;
            if (length && !inputValue) {
                const keys = [...selections.keys()];
                let index = length - 1;
                let targetLabel = keys[index];
                let targetItem = selections.get(targetLabel);
                let isAllDisabled = false;
                if (targetItem.disabled && index === 0) {
                    return;
                }
                while (targetItem.disabled && index !== 0) {
                    index = index - 1;
                    targetLabel = keys[index];
                    targetItem = selections.get(targetLabel);
                    if (index == 0 && targetItem.disabled) {
                        isAllDisabled = true;
                    }
                }
                if (!isAllDisabled) {
                    this.removeTag(targetItem);
                }
            }
        }
    }

    #notifyChange(selections: Map<any, any>) {
        const { onChangeWithObject } = this.getProps();
        const stateSelections = this.getState('selections');

        const selectionsProps = [...selections.values()];
        const isMultiple = this.#isMultiple();
        const hasChange = this.#diffSelections(selections, stateSelections, isMultiple);

        if (!hasChange) {
            return;
        }
        if (onChangeWithObject) {
            this.#notifyChangeWithObject(selections);
        } else if (isMultiple) {
            this._adapter.notifyChange(selectionsProps.map((props) => props.value));
        } else {
            this._adapter.notifyChange(selectionsProps[0]?.value);
        }
    }

    #removeInternalKey(option: BasicOptionProps) {
        let newOption = { ...option };
        delete newOption._parentGroup;
        delete newOption._show;
        delete newOption._selected;
        delete newOption._scrollIndex;
        delete newOption._keyInJsx;
        delete newOption._inputCreateOnly;
        delete newOption._notExist;
        return newOption;
    }

    #notifySelect(value: BasicOptionProps['value'], option: BasicOptionProps) {
        const newOption = this.#removeInternalKey(option);
        this._adapter.notifySelect(value, newOption);
    }

    #notifyDeselect(value: BasicOptionProps['value'], option: BasicOptionProps) {
        const newOption = this.#removeInternalKey(option);
        this._adapter.notifyDeselect(value, newOption);
    }

    #diffSelections(selections: Map<any, any>, oldSelections: Map<any, any>, isMultiple: boolean) {
        if (isMultiple) {
            return !isEqual([...selections.keys()], [...oldSelections.keys()]);
        }
        const [option] = selections.values();
        const [oldOption] = oldSelections.values();
        return !isEqual(option?.value, oldOption?.value) || !isEqual(option?.label, oldOption?.label);
    }

    #notifyChangeWithObject(selections: Map<any, any>) {
        const values = [];
        for (const item of selections.values()) {
            values.push(this.#removeInternalKey(item));
        }
        if (!this.#isMultiple()) {
            this._adapter.notifyChange(values[0]);
        } else {
            this._adapter.notifyChange(values);
        }
    }

    #notifyBlur(e: Event) {
        this.#blurPending = false;
        this._adapter.notifyBlur(e);
    }

    // focus moving between the trigger and its search input notifies once
    #notifyFocus(e: FocusEvent) {
        if (!this.#blurPending && !this.#isDisabled()) {
            this.#blurPending = true;
            this._adapter.notifyFocus(e);
        }
    }

    #toggle2SearchInput(isShow: boolean) {
        if (isShow) {
            this._adapter.toggleInputShow(isShow, () => this.#focusInput());
        } else {
            this._adapter.toggleInputShow(isShow, () => undefined);
        }
    }

    #updateOptionsActiveStatus(selections: Map<any, any>, options: BasicOptionProps[] = this.getState('options')) {
        this._adapter.updateOptions(SelectFoundation.#markSelected(this.getProps(), selections, options));
    }

    #focusInput() {
        this._adapter.focusInput();
        this._adapter.updateFocusState(true);
        this._adapter.setIsFocusInContainer(false);
    }

    #filterByKeyword(options: BasicOptionProps[]) {
        const { inputValue } = this.getStates();
        return inputValue && !this.getProp('remote') ? this.#filterOption(options, inputValue) : options;
    }

    #handleOptionListChange() {
        const { focusIndex, options } = this.getStates();
        const focusedOption = options.filter((option) => option._show)[focusIndex];
        const newOptionList = this.#filterByKeyword(this._adapter.getOptionsFromChildren());
        this.#updateOptionsActiveStatus(this.getState('selections'), newOptionList);
        // Appending options (load more on scroll or from a slot button) keeps the highlight and the scroll position
        const keptIndex = focusedOption ? newOptionList.filter((option) => option._show).findIndex((option) => option.value === focusedOption.value) : -1;
        if (keptIndex !== -1) {
            this._adapter.updateFocusIndex(keptIndex);
            return;
        }
        const selectedIndex = this.#selectedIndex(newOptionList);
        if (selectedIndex === -1 && !this.getProp('defaultActiveFirstOption')) {
            return;
        }
        const index = selectedIndex !== -1 ? selectedIndex : SelectFoundation.#firstEnabledIndex(newOptionList);
        // Without a previous highlight (the pointer is on a slot) nothing moved out of view, so the list stays put
        if (focusedOption) {
            this.#setFocusIndex(index);
        } else {
            this._adapter.updateFocusIndex(index);
        }
    }

    #handleOptionListChangeHadDefaultValue() {
        const { onChangeWithObject } = this.getProps();
        const items = [...this.getState('selections').values()].map((item) => (onChangeWithObject ? item : item.value));
        const value = this.#isMultiple() ? items : items[0];
        this.#update(value, this.#filterByKeyword(this._adapter.getOptionsFromChildren()));
    }

    #handleValueChange(value: PropValue) {
        const { allowCreate } = this.getProps();
        let originalOptions;
        if (allowCreate && this._isControlledComponent()) {
            originalOptions = (this.getState('options') as BasicOptionProps[]).map((item) => ({
                ...item,
                _show: true,
            }));
        } else {
            // state options may be stale: optionList and value can change in the same update
            originalOptions = this._adapter.getOptionsFromChildren();
        }
        this.#update(value, this.#filterByKeyword(originalOptions));
    }

    /** `options` is the host's option list from optionList or the option children */
    static getInitialState(props: SelectBaseProps, options: BasicOptionProps[]) {
        const value = (props.value !== undefined ? props.value : props.defaultValue) as PropValue;
        const selections = SelectFoundation.#resolveSelections(props, value, options, new Map());
        const { multiple, ellipsisTrigger, maxTagCount } = props;
        return {
            options: SelectFoundation.#markSelected(props, selections, options),
            selections,
            focusIndex: props.defaultActiveFirstOption ? SelectFoundation.#firstEnabledIndex(options) : -1,
            overflowItemCount: multiple && ellipsisTrigger && typeof maxTagCount === 'number' ? Math.max(selections.size - maxTagCount, 0) : 0,
        };
    }

    override init() {
        if (this.#initialized) {
            return;
        }
        this.#initialized = true;
        if (this.getProp('defaultOpen') && !this.#isDisabled()) {
            this.open();
        }

        if (this.getProp('autoFocus') && !this.#isDisabled()) {
            this.focus();
        }
    }

    focus(optionsForOpen?: BasicOptionProps[], openDropdown?: boolean) {
        const isFilterable = this.#isFilterable();
        const isMultiple = this.#isMultiple();
        const { isOpen } = this.getStates();
        const { searchPosition } = this.getProps();
        const shouldOpenDropdown = openDropdown !== false;

        this._adapter.updateFocusState(true);
        this._adapter.setIsFocusInContainer(false);

        if (isFilterable) {
            /**
             * openDropdown false only refocuses the Select. With searchPosition='dropdown' the search input lives in
             * the dropdown, so toggling the trigger input here would disturb tabIndex and focusability.
             */
            if (!shouldOpenDropdown) {
                if (searchPosition === strings.SEARCH_POSITION_TRIGGER) {
                    if (isMultiple) {
                        this.#focusInput();
                    } else {
                        this.#toggle2SearchInput(true);
                    }
                } else {
                    this.#focusTrigger();
                }
                return;
            }

            if (isMultiple) {
                this.#focusInput();
                if (!isOpen) {
                    this.open(undefined, optionsForOpen);
                }
            } else {
                this.#toggle2SearchInput(true);
                if (!isOpen) {
                    this.open(undefined, optionsForOpen);
                }
            }
        } else {
            this.#focusTrigger();
        }
    }

    /** After an update, the host reports whether the options (optionList or children) and value changed by its own change detection */
    handleInputsChange({ optionsChanged, valueChanged }: { optionsChanged: boolean; valueChanged: boolean }, value: PropValue) {
        if (optionsChanged) {
            this.#handleOptionListChange();
        }
        // an updated optionList can change the label of an unchanged value
        if (valueChanged || (optionsChanged && value !== undefined)) {
            this.#handleValueChange(value);
        } else if (optionsChanged) {
            this.#handleOptionListChangeHadDefaultValue();
        }
    }

    handleClick(e: Pick<MouseEvent, 'target' | 'currentTarget' | 'detail'>) {
        const { clickToHide } = this.getProps();
        const { isOpen } = this.getStates();
        const isDisabled = this.#isDisabled();

        // Enter and Space on a control inside the trigger click it; that click must not act on the list too
        if (isDisabled || isInnerControlActivation(e)) {
            return;
        } else if (!isOpen) {
            this.open();
        } else if (isOpen && clickToHide) {
            this.close({ event: e });
        } else if (isOpen && !clickToHide) {
            this.#focusInput();
        }
    }

    open(_acInput?: string, originalOptions?: BasicOptionProps[]) {
        // Reopening during the leave animation cancels its afterClose, so the work close() deferred to it runs now
        this.#events.emit('popoverClose');
        const isFilterable = this.#isFilterable();
        let options = originalOptions || this.getState('options');
        if (isFilterable) {
            const sugInput = '';
            options = this.#filterOption(options, sugInput).filter((item) => !item._inputCreateOnly);
            this._adapter.updateOptions(options);
            this.#toggle2SearchInput(true);
        } else {
            this._adapter.updateFocusState(true);
        }
        this.#focusSelectedOption(options);
        this._adapter.openMenu(() => {
            const { searchPosition, autoFocus } = this.getProps();
            if (autoFocus && searchPosition === strings.SEARCH_POSITION_DROPDOWN) {
                this._adapter.focusDropdownInput();
            }
        });
        this._adapter.notifyDropdownVisibleChange(true);
    }

    handleClickOutside(e: MouseEvent) {
        // refocusing the trigger would also scroll the page to a defaultOpen dropdown opened elsewhere
        this.close({ event: e, returnFocus: false });
        // a defaultOpen dropdown never had focus: no onFocus to pair onBlur with
        if (this.#blurPending) {
            this.#notifyBlur(e);
        }
        this._adapter.updateFocusState(false);
    }

    close(closeConfig?: { event?: any; closeCb?: () => void; notToggleInput?: boolean; returnFocus?: boolean }) {
        const { isFocus, isOpen } = this.getStates();
        // popoverClose fires only when an open dropdown leaves; a callback registered while closed would run later
        if (!isOpen) {
            return;
        }
        const { event, closeCb, notToggleInput, returnFocus = true } = closeConfig || {};
        if (isFocus && returnFocus) {
            // before closeMenu: the blur this moves out of the search input must still see the dropdown open
            this.#focusTrigger();
        }
        this._adapter.closeMenu();
        this._adapter.notifyDropdownVisibleChange(false);
        this._adapter.setIsFocusInContainer(false);

        const isFilterable = this.#isFilterable();
        if (isFilterable && !notToggleInput) {
            this.#toggle2SearchInput(false);
        }

        this.#events.once('popoverClose', () => {
            if (isFilterable) {
                this.clearInput(event);
            }
            if (closeCb) {
                closeCb();
            }
        });
    }

    onSelect(option: BasicOptionProps, optionIndex: number, event: MouseEvent | KeyboardEvent) {
        const isDisabled = this.#isDisabled();
        if (isDisabled) {
            return;
        }

        if (option._inputCreateOnly) {
            this._adapter.notifyCreate(this.#removeInternalKey(option));
        }

        const isMultiple = this.#isMultiple();
        if (!isMultiple) {
            this.#handleSingleSelect(option, event);
        } else {
            this.#handleMultipleSelect(option, event);
        }
        this._adapter.updateFocusIndex(optionIndex);
    }

    clearSelected() {
        const selections = new Map();
        if (this._isControlledComponent()) {
            this.#notifyChange(selections);
            this._adapter.notifyClear();
        } else {
            this.#notifyChange(selections);
            this._adapter.updateSelection(selections);
            this.#updateOptionsActiveStatus(selections);
            this._adapter.notifyClear();
        }
    }

    removeTag(item: BasicOptionProps) {
        const selections = this._adapter.getSelections();
        selections.delete(item.value);

        if (this._isControlledComponent()) {
            this.#notifyDeselect(item.value, item);
            this.#notifyChange(selections);
        } else {
            this.#notifyDeselect(item.value, item);
            this.#notifyChange(selections);
            this._adapter.updateSelection(selections);
            this.updateOverflowItemCount(selections.size);
            this.#updateOptionsActiveStatus(selections);
        }
    }

    // event is optional: users may call clearInput through the ref
    clearInput(event?: any) {
        const { inputValue } = this.getStates();
        if (inputValue !== '') {
            this._adapter.updateInputValue('');
            this._adapter.notifySearch('', event);
            const { options } = this.getStates();
            const { remote } = this.getProps();
            let optionsAfterFilter = options;
            if (!remote) {
                optionsAfterFilter = this.#filterOption(options, '');
            }
            this._adapter.updateOptions(optionsAfterFilter);
        }
    }

    handleInputChange(sugInput: string, event: unknown) {
        this._adapter.updateInputValue(sugInput);
        const { options } = this.getStates();
        const { allowCreate, remote } = this.getProps();

        let optionsAfterFilter = options;
        if (!remote) {
            optionsAfterFilter = this.#filterOption(options, sugInput);
        }

        optionsAfterFilter = this.#createOptionByInput(allowCreate, optionsAfterFilter, sugInput);

        this._adapter.updateOptions(optionsAfterFilter);
        // The old focusIndex indexes the previous visible list. Known limitation: the scroll runs before the filtered
        // rows render, so it goes to where that index sits in the previous list, which is off when many disabled
        // options precede the first enabled match. Upgrade by scrolling from the host once the new rows are laid out.
        this.#setFocusIndex(this.getProp('defaultActiveFirstOption') ? SelectFoundation.#firstEnabledIndex(optionsAfterFilter) : -1);
        this._adapter.notifySearch(sugInput, event);
    }

    // searchPosition='dropdown' binds to the dropdown input, since the popup is not a DOM child of the trigger
    handleKeyDown(event: KeyboardEvent) {
        const { loading, filter, multiple, disabled, searchPosition } = this.getProps();
        const { isOpen } = this.getStates();

        if (loading || disabled || isComposing(event) || isInnerControlKey(event)) {
            return;
        }
        // a search input owns characters, Space, Home and End
        const editing = isTextEditor(event.target) || (filter && searchPosition === strings.SEARCH_POSITION_TRIGGER);
        if (!editing && this.#handleSelectOnlyKeyDown(event)) {
            return;
        }
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                this.#handleArrowKeyDown(-1);
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.#handleArrowKeyDown(1);
                break;
            case 'Backspace':
                this.#handleBackspaceKeyDown();
                break;
            case ENTER_KEY:
                handlePrevent(event);
                this.#handleEnterKeyDown(event);
                break;
            case 'Escape':
                // claiming the key keeps the overlay stack from also closing an enclosing dialog
                if (isOpen) {
                    event.preventDefault();
                    this.close({ event: event });
                }
                if (filter && !multiple) {
                    this.#focusTrigger();
                }
                break;
            case 'Tab':
                this.#handleTabKeyDown(event);
                break;
            default:
                break;
        }
    }

    // keys on a focusable element in a panel slot; the dropdown search input has closed the dropdown on Escape already
    handleContainerKeyDown(event: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'preventDefault' | 'stopPropagation'> & Parameters<typeof isComposing>[0]) {
        if (!this.getStates().isOpen || isComposing(event)) {
            return;
        }
        if (event.key === 'Tab') {
            this.#handleTabKeyDown(event);
        } else if (event.key === 'Escape') {
            // claiming the key keeps the overlay stack from also closing an enclosing dialog
            event.preventDefault();
            // the focused slot element leaves with the dropdown
            this.#focusTrigger();
            this.close({ event });
        }
    }

    handleMouseEnter(e: MouseEvent) {
        this._adapter.notifyMouseEnter(e);
    }

    handleMouseLeave(e: MouseEvent) {
        this._adapter.notifyMouseLeave(e);
    }

    // a custom trigger may call triggerRender `onClear()` without an event
    handleClearClick(e?: MouseEvent) {
        const { filter, searchPosition } = this.getProps();
        if (filter && searchPosition === strings.SEARCH_POSITION_TRIGGER) {
            this.clearInput(e);
        }
        this.focus(undefined, false);
        this.clearSelected();
        // keeps this click from opening the dropdown
        e?.stopPropagation();
    }

    handleOptionMouseEnter(optionIndex: number) {
        this._adapter.updateFocusIndex(optionIndex);
    }

    handleListScroll(e: LE) {
        this._adapter.notifyListScroll(e);
    }

    handleTriggerFocus(e: FocusEvent) {
        this._adapter.setIsFocusInContainer(false);
        this.#notifyFocus(e);
    }

    handleTriggerBlur(e: FocusEvent) {
        const { isOpen } = this.getStates();
        // while open, focus may move into the dropdown; a press outside notifies via handleClickOutside
        if (this.#blurPending && !isOpen) {
            this.#notifyBlur(e);
            this._adapter.updateFocusState(false);
        }
    }

    // tabbing into the search input skips the trigger's focus handling
    handleInputFocus(e: FocusEvent) {
        this.#notifyFocus(e);
        if (this.#isMultiple() && this.#isFilterable()) {
            this._adapter.updateFocusState(true);
        }
    }

    handleInputBlur() {
        const { filter, autoFocus } = this.getProps();
        const { showInput, isOpen } = this.getStates();
        const isMultiple = this.#isMultiple();
        if (filter && !isMultiple) {
            if ((showInput || autoFocus) && !isOpen) {
                this.#toggle2SearchInput(false);
            }
        }
    }

    selectAll() {
        if (!this.#isMultiple()) {
            console.warn(`[Semi Select]: It seems that you have called the selectAll method in the single-selection Select.
                Please note that this is not a legal way to use it`);
            return;
        }
        const { options } = this.getStates();
        const maxLimit = this._adapter.getMaxLimit();
        const selections = this._adapter.getSelections();
        const sizeBefore = selections.size;
        for (const option of options) {
            if (!option._show || option.disabled || option._inputCreateOnly || selections.has(option.value)) {
                continue;
            }
            if (maxLimit && selections.size >= maxLimit) {
                this._adapter.notifyMaxLimit(this.#removeInternalKey(option));
                break;
            }
            selections.set(option.value, option);
        }
        if (selections.size === sizeBefore) {
            return;
        }
        // before writing: #notifyChange diffs against the selections in state
        this.#notifyChange(selections);
        if (!this._isControlledComponent()) {
            this._adapter.updateSelection(selections);
            this.updateOverflowItemCount(selections.size);
            this.#updateOptionsActiveStatus(selections);
        }
    }

    updateScrollTop() {
        const { focusIndex } = this.getStates();
        this._adapter.updateScrollTop(focusIndex === -1 ? undefined : focusIndex);
    }

    updateOverflowItemCount(selectionLength: number, overFlowCount?: number) {
        const { maxTagCount, ellipsisTrigger } = this.getProps();
        if (!ellipsisTrigger) {
            return;
        }
        if (overFlowCount) {
            this._adapter.updateOverflowItemCount(overFlowCount);
        } else if (typeof maxTagCount === 'number') {
            if (selectionLength - maxTagCount > 0) {
                this._adapter.updateOverflowItemCount(selectionLength - maxTagCount);
            } else {
                this._adapter.updateOverflowItemCount(0);
            }
        }
    }

    updateIsFullTags() {
        const { isFullTags } = this.getStates();
        if (!isFullTags) {
            this._adapter.setState({
                isFullTags: true,
            });
        }
    }

    handlePopoverClose() {
        this.#events.emit('popoverClose');
    }

    handleSlotMouseEnter() {
        this._adapter.updateFocusIndex(-1);
    }
}
