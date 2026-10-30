import { isEqual } from 'es-toolkit';
import type { FocusableElement } from 'tabbable';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { getEnabledStepIndex, getListTargetIndex, handlePrevent, isInnerControlActivation, isInnerControlKey, isTextEditor, Typeahead } from '../utils/a11y';
import EventEmitter from '../utils/event';
import FocusTrapHandle from '../utils/focus-handle';
import { ENTER_KEY, isComposing } from '../utils/key-code';
import warning from '../utils/warning';
import { strings } from './constants';
import type { BasicOptionProps, OptionRecord } from './option-foundation';

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
    options: OptionRecord[];
    /** The selected options' data by value */
    selections: Map<any, any>;
    showInput: boolean;
}

/** The fields the foundation reads from a keydown, so a host framework's own event type also fits */
export type SelectKeyEvent = Pick<KeyboardEvent, 'key' | 'target' | 'currentTarget' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'preventDefault' | 'stopPropagation'> & Parameters<typeof isComposing>[0];

/** LE is the host's option list scroll event, which the foundation only passes through */
export interface SelectAdapter<P extends SelectBaseProps = SelectBaseProps, S extends SelectBaseState = SelectBaseState, LE = unknown> extends DefaultAdapter<P, S> {
    updateFocusState(focus: boolean): void;
    focusTrigger(): void;
    getOptionsFromChildren(): OptionRecord[];
    updateOptions(options: OptionRecord[]): void;
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

    static #resolveSelections(props: SelectBaseProps, propValue: PropValue, originalOptions: OptionRecord[], nowSelections: Map<any, any>) {
        return props.multiple ? SelectFoundation.#resolveMultiple(props, propValue as PropValue[], originalOptions, nowSelections) : SelectFoundation.#resolveSingle(props, propValue, originalOptions);
    }

    static #firstEnabledIndex(options: OptionRecord[]) {
        return options.filter((option) => option.show).findIndex((option) => !option.data.disabled);
    }

    static #markSelected({ allowCreate }: SelectBaseProps, selections: Map<any, any>, options: OptionRecord[]): OptionRecord[] {
        return options.map((option) => {
            if (selections.has(option.data.value)) {
                // a created option stays once selected, as an ordinary option
                return allowCreate ? { ...option, selected: true, create: false } : { ...option, selected: true };
            }
            if (option.create) {
                return { ...option, show: false, selected: false };
            }
            return { ...option, selected: false };
        });
    }

    static #resolveSingle({ onChangeWithObject }: SelectBaseProps, propValue: PropValue, originalOptions: OptionRecord[]) {
        const selections = new Map();

        // with onChangeWithObject the value prop is an option object
        const selectedValue = onChangeWithObject ? (propValue as BasicOptionProps)?.value : propValue;
        const selectedOption = originalOptions.find((option) => option.data.value === selectedValue);

        if (selectedOption) {
            selections.set(selectedValue, selectedOption.data);
        } else if (typeof selectedValue !== 'undefined' && selectedValue !== null) {
            const optionNotExist = onChangeWithObject ? { ...(propValue as BasicOptionProps) } : { value: propValue, label: propValue };
            selections.set(optionNotExist.value, optionNotExist);
        }
        return selections;
    }

    static #resolveMultiple({ onChangeWithObject }: SelectBaseProps, propValue: PropValue[], originalOptions: OptionRecord[], nowSelections: Map<any, any>) {
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
                const record = originalOptions.find((option) => option.data.value === selectedValue);
                if (record) {
                    selections.set(selectedValue, record.data);
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
                        selections.set(selectedValue, onChangeWithObject ? { ...selectedObjects[i] } : { value: selectedValue, label: selectedValue });
                    }
                }
            });
        }

        return selections;
    }

    #focusTrigger() {
        this.adapter.focusTrigger();
    }

    #update(propValue: PropValue, originalOptions: OptionRecord[]) {
        const selections = SelectFoundation.#resolveSelections(this.getProps(), propValue, originalOptions, this.getState('selections'));
        if (this.#isMultiple()) {
            this.updateOverflowItemCount(selections.size);
        }
        this.adapter.updateSelection(selections);
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

    #handleSingleSelect(option: BasicOptionProps, event: unknown) {
        const selections = new Map().set(option.value, option);
        this.adapter.notifySelect(option.value, option);
        // option updates wait for the close animation, or the visible popup flashes
        const isFilterable = this.#isFilterable();

        if (this.isControlledComponent()) {
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
            this.adapter.updateSelection(selections);

            this.close({
                event: event,
                closeCb: () => {
                    this.#updateOptionsActiveStatus(selections);
                },
            });
        }
    }

    #handleMultipleSelect(option: BasicOptionProps, event: unknown) {
        const { value } = option;
        const maxLimit = this.adapter.getMaxLimit();
        const selections = this.adapter.getSelections();
        const { autoClearSearchValue } = this.getProps();
        if (selections.has(value)) {
            this.adapter.notifyDeselect(value, option);
            selections.delete(value);
        } else if (maxLimit && selections.size >= maxLimit) {
            this.adapter.notifyMaxLimit(option);
            return;
        } else {
            this.adapter.notifySelect(value, option);
            selections.set(value, option);
        }
        if (this.isControlledComponent()) {
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
            this.adapter.updateSelection(selections);
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

    #filterOption(originalOptions: OptionRecord[], sugInput: string) {
        const filter = this.getProp('filter');
        if (!filter) {
            return originalOptions;
        } else if (typeof filter === 'function') {
            return originalOptions.map((option) => ({ ...option, show: Boolean(filter(sugInput, option.data)) }));
        }
        const input = sugInput.toLowerCase();

        return originalOptions.map((option) => {
            // entries may carry only a value, and a node label has no text to match
            const label = option.data.label ?? option.data.value;
            const text = typeof label === 'string' || typeof label === 'number' ? String(label).toLowerCase() : '';
            const groupLabel = option.group?.label;
            const matchOption = text.includes(input);
            const matchGroup = (typeof groupLabel === 'string' || typeof groupLabel === 'number') && String(groupLabel).toLowerCase().includes(input);
            return { ...option, show: matchOption || matchGroup };
        });
    }

    #createOptionByInput(allowCreate: boolean, optionsAfterFilter: OptionRecord[], sugInput: string) {
        if (allowCreate) {
            if (sugInput) {
                let createOptionIndex = -1;
                let matchOptionIndex = -1;
                optionsAfterFilter = optionsAfterFilter.map((option, index) => {
                    if (!option.show && !option.create) {
                        return option;
                    }
                    if (option.data.label === sugInput) {
                        matchOptionIndex = index;
                    }
                    if (option.create) {
                        createOptionIndex = index;
                        return { ...option, data: { value: sugInput, label: sugInput }, show: true };
                    }
                    return option;
                });

                if (createOptionIndex === -1 && matchOptionIndex === -1) {
                    optionsAfterFilter = [...optionsAfterFilter, { data: { value: sugInput, label: sugInput }, index: -1, show: true, selected: false, create: true }];
                }
                if (matchOptionIndex !== -1) {
                    optionsAfterFilter = optionsAfterFilter.filter((item) => !item.create);
                }
            } else {
                optionsAfterFilter = optionsAfterFilter.filter((item) => !item.create);
            }
        }
        // Known limit: creation is synchronous; an async (Promise) creation hook is unsupported.
        return optionsAfterFilter;
    }

    #setFocusIndex(index: number) {
        this.adapter.updateFocusIndex(index);
        if (index !== -1) {
            this.adapter.updateScrollTop(index);
        }
    }

    #moveFocus(offset: number) {
        const { focusIndex, options } = this.getStates();
        const visibleOptions = options.filter((item) => item.show);
        this.#setFocusIndex(getEnabledStepIndex(offset, focusIndex, visibleOptions.length, (i) => visibleOptions[i].data.disabled));
    }

    #selectedIndex(options: OptionRecord[]) {
        const selections = this.getState('selections');
        return options.filter((option) => option.show).findIndex((option) => selections.has(option.data.value));
    }

    // APG: the highlight starts on the selected option; returns whether one is shown
    #focusSelectedOption(options: OptionRecord[]) {
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
    #handleSelectOnlyKeyDown(event: SelectKeyEvent) {
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
        const visibleOptions = options.filter((option) => option.show);
        let index: number | null;
        if (isTypeahead) {
            const labels = visibleOptions.map(({ data }) => {
                const label = data.label ?? data.value;
                return !data.disabled && (typeof label === 'string' || typeof label === 'number') ? String(label) : '';
            });
            index = this.#typeahead.match(key, labels, focusIndex);
        } else {
            index = getListTargetIndex(key, focusIndex, visibleOptions.length, (i) => visibleOptions[i].data.disabled);
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
            const focusableElements = FocusTrapHandle.getFocusableElements(this.adapter.getOptionList());
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
        return FocusTrapHandle.getActiveElement(this.adapter.getOptionList());
    }

    #handlePanelOpenTabKeyDown(focusableElements: FocusableElement[], event: Pick<KeyboardEvent, 'preventDefault' | 'stopPropagation'>) {
        const activeElement = this.#getActiveElement();
        const isFocusInContainer = this.adapter.getIsFocusInContainer();
        if (!isFocusInContainer) {
            focusableElements[0].focus();
            this.adapter.setIsFocusInContainer(true);
            handlePrevent(event);
        } else if (activeElement === focusableElements.at(-1)) {
            this.#focusTrigger();
            this.close({ event });
            handlePrevent(event);
        }
    }

    #handlePanelOpenShiftTabKeyDown(focusableElements: FocusableElement[], event: Pick<KeyboardEvent, 'preventDefault' | 'stopPropagation'>) {
        const activeElement = this.#getActiveElement();
        const isFocusInContainer = this.adapter.getIsFocusInContainer();

        if (!isFocusInContainer) {
            this.close({ event });
        } else if (activeElement === focusableElements[0]) {
            this.#focusTrigger();
            this.adapter.setIsFocusInContainer(false);
            handlePrevent(event);
        }
    }

    #handleEnterKeyDown(event: unknown) {
        const { isOpen, options, focusIndex } = this.getStates();
        if (!isOpen) {
            this.open();
        } else {
            if (focusIndex !== -1) {
                const visibleOptions = options.filter((item) => item.show);
                const { length } = visibleOptions;
                // stale after the visible options shrink
                if (length <= focusIndex) {
                    return;
                }
                if (visibleOptions && length) {
                    const selectedOption = visibleOptions[focusIndex];
                    if (selectedOption.data.disabled) {
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
            const selections = this.adapter.getSelections();
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
            this.adapter.notifyChange(selectionsProps.map((props) => props.value));
        } else {
            this.adapter.notifyChange(selectionsProps[0]?.value);
        }
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
        const values = [...selections.values()];
        if (!this.#isMultiple()) {
            this.adapter.notifyChange(values[0]);
        } else {
            this.adapter.notifyChange(values);
        }
    }

    #notifyBlur(e: unknown) {
        this.#blurPending = false;
        this.adapter.notifyBlur(e);
    }

    // focus moving between the trigger and its search input notifies once
    #notifyFocus(e: unknown) {
        if (!this.#blurPending && !this.#isDisabled()) {
            this.#blurPending = true;
            this.adapter.notifyFocus(e);
        }
    }

    #toggle2SearchInput(isShow: boolean) {
        if (isShow) {
            this.adapter.toggleInputShow(isShow, () => this.#focusInput());
        } else {
            this.adapter.toggleInputShow(isShow, () => undefined);
        }
    }

    #updateOptionsActiveStatus(selections: Map<any, any>, options: OptionRecord[] = this.getState('options')) {
        this.adapter.updateOptions(SelectFoundation.#markSelected(this.getProps(), selections, options));
    }

    #focusInput() {
        this.adapter.focusInput();
        this.adapter.updateFocusState(true);
        this.adapter.setIsFocusInContainer(false);
    }

    #filterByKeyword(options: OptionRecord[]) {
        const { inputValue } = this.getStates();
        return inputValue && !this.getProp('remote') ? this.#filterOption(options, inputValue) : options;
    }

    #handleOptionListChange() {
        const { focusIndex, options } = this.getStates();
        const focusedOption = options.filter((option) => option.show)[focusIndex];
        const newOptionList = this.#filterByKeyword(this.adapter.getOptionsFromChildren());
        this.#updateOptionsActiveStatus(this.getState('selections'), newOptionList);
        // Appending options (load more on scroll or from a slot button) keeps the highlight and the scroll position
        const keptIndex = focusedOption ? newOptionList.filter((option) => option.show).findIndex((option) => option.data.value === focusedOption.data.value) : -1;
        if (keptIndex !== -1) {
            this.adapter.updateFocusIndex(keptIndex);
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
            this.adapter.updateFocusIndex(index);
        }
    }

    #handleOptionListChangeHadDefaultValue() {
        const { onChangeWithObject } = this.getProps();
        const items = [...this.getState('selections').values()].map((item) => (onChangeWithObject ? item : item.value));
        const value = this.#isMultiple() ? items : items[0];
        this.#update(value, this.#filterByKeyword(this.adapter.getOptionsFromChildren()));
    }

    #handleValueChange(value: PropValue) {
        const { allowCreate } = this.getProps();
        let originalOptions;
        if (allowCreate && this.isControlledComponent()) {
            originalOptions = this.getState('options').map((item) => ({ ...item, show: true }));
        } else {
            // state options may be stale: optionList and value can change in the same update
            originalOptions = this.adapter.getOptionsFromChildren();
        }
        this.#update(value, this.#filterByKeyword(originalOptions));
    }

    /** `options` is the host's option list from optionList or the option children */
    static getInitialState(props: SelectBaseProps, options: OptionRecord[]) {
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

    focus = (optionsForOpen?: OptionRecord[], openDropdown?: boolean) => {
        const isFilterable = this.#isFilterable();
        const isMultiple = this.#isMultiple();
        const { isOpen } = this.getStates();
        const { searchPosition } = this.getProps();
        const shouldOpenDropdown = openDropdown !== false;

        this.adapter.updateFocusState(true);
        this.adapter.setIsFocusInContainer(false);

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
    };

    /** After an update, the host reports whether the options (optionList or children) and value changed by its own change detection */
    handleInputsChange = ({ optionsChanged, valueChanged }: { optionsChanged: boolean; valueChanged: boolean }, value: PropValue) => {
        if (optionsChanged) {
            this.#handleOptionListChange();
        }
        // an updated optionList can change the label of an unchanged value
        if (valueChanged || (optionsChanged && value !== undefined)) {
            this.#handleValueChange(value);
        } else if (optionsChanged) {
            this.#handleOptionListChangeHadDefaultValue();
        }
    };

    handleClick = (e: Pick<MouseEvent, 'target' | 'currentTarget' | 'detail'>) => {
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
    };

    open = (_acInput?: string, originalOptions?: OptionRecord[]) => {
        // Reopening during the leave animation cancels its afterClose, so the work close() deferred to it runs now
        this.#events.emit('popoverClose');
        const isFilterable = this.#isFilterable();
        let options = originalOptions || this.getState('options');
        if (isFilterable) {
            const sugInput = '';
            options = this.#filterOption(options, sugInput).filter((item) => !item.create);
            this.adapter.updateOptions(options);
            this.#toggle2SearchInput(true);
        } else {
            this.adapter.updateFocusState(true);
        }
        this.#focusSelectedOption(options);
        this.adapter.openMenu(() => {
            const { searchPosition, autoFocus } = this.getProps();
            if (autoFocus && searchPosition === strings.SEARCH_POSITION_DROPDOWN) {
                this.adapter.focusDropdownInput();
            }
        });
        this.adapter.notifyDropdownVisibleChange(true);
    };

    handleClickOutside = (e: MouseEvent) => {
        // refocusing the trigger would also scroll the page to a defaultOpen dropdown opened elsewhere
        this.close({ event: e, returnFocus: false });
        // a defaultOpen dropdown never had focus: no onFocus to pair onBlur with
        if (this.#blurPending) {
            this.#notifyBlur(e);
        }
        this.adapter.updateFocusState(false);
    };

    close = (closeConfig?: { event?: unknown; closeCb?: () => void; notToggleInput?: boolean; returnFocus?: boolean }) => {
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
        this.adapter.closeMenu();
        this.adapter.notifyDropdownVisibleChange(false);
        this.adapter.setIsFocusInContainer(false);

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
    };

    onSelect = (option: OptionRecord, optionIndex: number, event: unknown) => {
        const isDisabled = this.#isDisabled();
        if (isDisabled) {
            return;
        }

        if (option.create) {
            this.adapter.notifyCreate(option.data);
        }

        const isMultiple = this.#isMultiple();
        if (!isMultiple) {
            this.#handleSingleSelect(option.data, event);
        } else {
            this.#handleMultipleSelect(option.data, event);
        }
        this.adapter.updateFocusIndex(optionIndex);
    };

    clearSelected = () => {
        const selections = new Map();
        if (this.isControlledComponent()) {
            this.#notifyChange(selections);
            this.adapter.notifyClear();
        } else {
            this.#notifyChange(selections);
            this.adapter.updateSelection(selections);
            this.#updateOptionsActiveStatus(selections);
            this.adapter.notifyClear();
        }
    };

    removeTag = (item: BasicOptionProps) => {
        const selections = this.adapter.getSelections();
        selections.delete(item.value);

        if (this.isControlledComponent()) {
            this.adapter.notifyDeselect(item.value, item);
            this.#notifyChange(selections);
        } else {
            this.adapter.notifyDeselect(item.value, item);
            this.#notifyChange(selections);
            this.adapter.updateSelection(selections);
            this.updateOverflowItemCount(selections.size);
            this.#updateOptionsActiveStatus(selections);
        }
    };

    // event is optional: users may call clearInput through the ref
    clearInput = (event?: unknown) => {
        const { inputValue } = this.getStates();
        if (inputValue !== '') {
            this.adapter.updateInputValue('');
            this.adapter.notifySearch('', event);
            const { options } = this.getStates();
            const { remote } = this.getProps();
            let optionsAfterFilter = options;
            if (!remote) {
                optionsAfterFilter = this.#filterOption(options, '');
            }
            this.adapter.updateOptions(optionsAfterFilter);
        }
    };

    handleInputChange = (sugInput: string, event: unknown) => {
        this.adapter.updateInputValue(sugInput);
        const { options } = this.getStates();
        const { allowCreate, remote } = this.getProps();

        let optionsAfterFilter = options;
        if (!remote) {
            optionsAfterFilter = this.#filterOption(options, sugInput);
        }

        optionsAfterFilter = this.#createOptionByInput(allowCreate, optionsAfterFilter, sugInput);

        this.adapter.updateOptions(optionsAfterFilter);
        // The old focusIndex indexes the previous visible list. Known limitation: the scroll runs before the filtered
        // rows render, so it goes to where that index sits in the previous list, which is off when many disabled
        // options precede the first enabled match. Upgrade by scrolling from the host once the new rows are laid out.
        this.#setFocusIndex(this.getProp('defaultActiveFirstOption') ? SelectFoundation.#firstEnabledIndex(optionsAfterFilter) : -1);
        this.adapter.notifySearch(sugInput, event);
    };

    // searchPosition='dropdown' binds to the dropdown input, since the popup is not a DOM child of the trigger
    handleKeyDown = (event: SelectKeyEvent) => {
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
    };

    // keys on a focusable element in a panel slot; the dropdown search input has closed the dropdown on Escape already
    handleContainerKeyDown = (event: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'preventDefault' | 'stopPropagation'> & Parameters<typeof isComposing>[0]) => {
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
    };

    handleMouseEnter = (e: unknown) => {
        this.adapter.notifyMouseEnter(e);
    };

    handleMouseLeave = (e: unknown) => {
        this.adapter.notifyMouseLeave(e);
    };

    // a custom trigger may call triggerRender `onClear()` without an event
    handleClearClick = (e?: Pick<MouseEvent, 'stopPropagation'>) => {
        const { filter, searchPosition } = this.getProps();
        if (filter && searchPosition === strings.SEARCH_POSITION_TRIGGER) {
            this.clearInput(e);
        }
        this.focus(undefined, false);
        this.clearSelected();
        // keeps this click from opening the dropdown
        e?.stopPropagation();
    };

    handleOptionMouseEnter = (optionIndex: number) => {
        this.adapter.updateFocusIndex(optionIndex);
    };

    handleListScroll = (e: LE) => {
        this.adapter.notifyListScroll(e);
    };

    handleTriggerFocus = (e: unknown) => {
        this.adapter.setIsFocusInContainer(false);
        this.#notifyFocus(e);
    };

    handleTriggerBlur = (e: unknown) => {
        const { isOpen } = this.getStates();
        // while open, focus may move into the dropdown; a press outside notifies via handleClickOutside
        if (this.#blurPending && !isOpen) {
            this.#notifyBlur(e);
            this.adapter.updateFocusState(false);
        }
    };

    // tabbing into the search input skips the trigger's focus handling
    handleInputFocus = (e: unknown) => {
        this.#notifyFocus(e);
        if (this.#isMultiple() && this.#isFilterable()) {
            this.adapter.updateFocusState(true);
        }
    };

    handleInputBlur = () => {
        const { filter, autoFocus } = this.getProps();
        const { showInput, isOpen } = this.getStates();
        const isMultiple = this.#isMultiple();
        if (filter && !isMultiple) {
            if ((showInput || autoFocus) && !isOpen) {
                this.#toggle2SearchInput(false);
            }
        }
    };

    selectAll = () => {
        if (!this.#isMultiple()) {
            console.warn(`[Semi Select]: It seems that you have called the selectAll method in the single-selection Select.
                Please note that this is not a legal way to use it`);
            return;
        }
        const { options } = this.getStates();
        const maxLimit = this.adapter.getMaxLimit();
        const selections = this.adapter.getSelections();
        const sizeBefore = selections.size;
        for (const { data, show, create } of options) {
            if (!show || data.disabled || create || selections.has(data.value)) {
                continue;
            }
            if (maxLimit && selections.size >= maxLimit) {
                this.adapter.notifyMaxLimit(data);
                break;
            }
            selections.set(data.value, data);
        }
        if (selections.size === sizeBefore) {
            return;
        }
        // before writing: #notifyChange diffs against the selections in state
        this.#notifyChange(selections);
        if (!this.isControlledComponent()) {
            this.adapter.updateSelection(selections);
            this.updateOverflowItemCount(selections.size);
            this.#updateOptionsActiveStatus(selections);
        }
    };

    updateScrollTop = () => {
        const { focusIndex } = this.getStates();
        this.adapter.updateScrollTop(focusIndex === -1 ? undefined : focusIndex);
    };

    updateOverflowItemCount = (selectionLength: number, overFlowCount?: number) => {
        const { maxTagCount, ellipsisTrigger } = this.getProps();
        if (!ellipsisTrigger) {
            return;
        }
        if (overFlowCount) {
            this.adapter.updateOverflowItemCount(overFlowCount);
        } else if (typeof maxTagCount === 'number') {
            if (selectionLength - maxTagCount > 0) {
                this.adapter.updateOverflowItemCount(selectionLength - maxTagCount);
            } else {
                this.adapter.updateOverflowItemCount(0);
            }
        }
    };

    updateIsFullTags = () => {
        const { isFullTags } = this.getStates();
        if (!isFullTags) {
            this.adapter.setState({
                isFullTags: true,
            });
        }
    };

    handlePopoverClose = () => {
        this.#events.emit('popoverClose');
    };

    handleSlotMouseEnter = () => {
        this.adapter.updateFocusIndex(-1);
    };
}
