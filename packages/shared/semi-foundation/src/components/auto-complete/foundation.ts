import BaseFoundation, { type DefaultAdapter } from '../../base/foundation';
import { getEnabledStepIndex, isInnerControlActivation } from '../../utils/a11y';
import isObject from '../../utils/is-object';
import { isComposing } from '../../utils/key-code';
import warning from '../../utils/warning';

export interface DataItem {
    [x: string]: any;
    value?: string | number;
    label?: any;
}

export interface StateOptionItem extends DataItem {
    show?: boolean;
    key?: string | number;
    // internal: the original data item as given (renderItem receives it); never reaches the callbacks
    _source?: DataItem | string | number;
}

export type AutoCompleteData = ReadonlyArray<DataItem | string | number>;

export interface AutoCompleteBaseProps {
    data?: AutoCompleteData;
    defaultActiveFirstOption?: boolean;
    defaultOpen?: boolean;
    defaultValue?: string | number;
    disabled?: boolean;
    loading?: boolean;
    onSelectWithObject?: boolean;
    // method syntax keeps the parameter bivariant so components can narrow it
    renderSelectedItem?(this: void, option: DataItem): string;
    value?: string | number;
}

export interface AutoCompleteBaseState {
    focusIndex: number;
    inputValue?: string | number;
    options: StateOptionItem[];
    /** The selected option's data by label; the custom trigger receives its values */
    selection: Map<any, DataItem>;
    visible: boolean;
}

/** FE is the host's focus and blur event, which the foundation only passes through */
export interface AutoCompleteAdapter<P extends AutoCompleteBaseProps = AutoCompleteBaseProps, S extends AutoCompleteBaseState = AutoCompleteBaseState, FE = unknown> extends DefaultAdapter<P, S> {
    notifyKeyDown: (e: any) => void;
    updateScrollTop: (index: number) => void;
    notifySearch: (inputValue: string) => void;
    notifyChange: (value: string | number) => void;
    notifySelect: (option: StateOptionItem | string | number) => void;
    notifyDropdownVisibleChange: (isVisible: boolean) => void;
    notifyClear: () => void;
    notifyFocus: (event?: FE) => void;
    notifyBlur: (event?: FE) => void;
}

export default class AutoCompleteFoundation<P extends AutoCompleteBaseProps = AutoCompleteBaseProps, S extends AutoCompleteBaseState = AutoCompleteBaseState, FE = unknown> extends BaseFoundation<AutoCompleteAdapter<P, S, FE>, P, S> {
    // data is compared by each host (React nodes in labels, Vue and Svelte arrays changed in place), which calls handleDataChange
    static override readonly propKeys = ['value'];

    static #generateList(data: AutoCompleteData) {
        const options: Array<StateOptionItem> = [];
        if (data && data.length) {
            data.forEach((item) => {
                // invalid items are skipped, not kept as placeholders: rendering, focusIndex and Enter index one list
                if (typeof item === 'string' || typeof item === 'number') {
                    options.push({ value: item, label: item, show: true, _source: item });
                } else if (isObject(item) && item.value !== undefined) {
                    options.push({ show: true, ...item, _source: item });
                }
            });
        }
        return options;
    }

    static #toDataItem({ show, _source, ...dataItem }: StateOptionItem): DataItem {
        return dataItem;
    }

    static #getRenderSelectedItem({ renderSelectedItem }: AutoCompleteBaseProps) {
        return renderSelectedItem ?? ((option: DataItem) => option?.value);
    }

    static #valueStates(props: AutoCompleteBaseProps, selectedValue: AutoCompleteBaseProps['value'], typed?: string | number) {
        // a controlled value set back to undefined empties the input; there is no option to render it from
        if (selectedValue === undefined) {
            return { inputValue: '', selection: new Map<any, DataItem>(), focusIndex: props.defaultActiveFirstOption ? 0 : -1 };
        }
        const renderSelectedItem = AutoCompleteFoundation.#getRenderSelectedItem(props);
        const options = AutoCompleteFoundation.#generateList(props.data).map((option) => AutoCompleteFoundation.#toDataItem(option));
        const selectedOptionIndex = options.findIndex((option) => renderSelectedItem(option) === selectedValue);
        const selectedOption = options[selectedOptionIndex];
        const selection = new Map<any, DataItem>();
        let inputValue: string | number;
        if (selectedOption) {
            selection.set(selectedOption.label, selectedOption);
            inputValue = renderSelectedItem(selectedOption);
        } else if (Object.is(selectedValue, typed)) {
            // Typing notifies the text, which a controlled parent or Svelte's bound value echoes back; renderSelectedItem
            // expects a data item, so passing the text through it would rewrite what the user typed
            inputValue = typed;
        } else {
            inputValue = renderSelectedItem({ label: selectedValue, value: selectedValue });
        }
        return {
            inputValue,
            selection,
            focusIndex: selectedOptionIndex === -1 && props.defaultActiveFirstOption ? 0 : selectedOptionIndex,
        };
    }

    #backwardLabelInValue() {
        const props = this.getProps();
        let { onSelectWithObject } = props;
        return onSelectWithObject;
    }

    #modifyFocusIndex(searchValue) {
        let { focusIndex } = this.getStates();

        let { data, defaultActiveFirstOption } = this.getProps();

        let selectedOptionIndex = -1;

        if (searchValue) {
            let renderSelectedItem = AutoCompleteFoundation.#getRenderSelectedItem(this.getProps());
            const options = AutoCompleteFoundation.#generateList(data);
            selectedOptionIndex = options.findIndex((option) => renderSelectedItem(AutoCompleteFoundation.#toDataItem(option)) === searchValue);
        }

        if (selectedOptionIndex === -1 && defaultActiveFirstOption) {
            if (focusIndex !== 0) {
                this.setState({ focusIndex: 0 });
            }
        } else {
            if (selectedOptionIndex !== focusIndex) {
                this.setState({ focusIndex: selectedOptionIndex });
            }
        }
    }

    #modifyFocusIndexOnPanelOpen() {
        let { inputValue } = this.getStates();
        this.#modifyFocusIndex(inputValue);
    }

    #moveFocus(offset: number) {
        const { focusIndex, options } = this.getStates();
        const visibleOptions = options.filter((item: StateOptionItem) => item.show);
        const index = getEnabledStepIndex(offset, focusIndex, visibleOptions.length, (i) => visibleOptions[i].disabled);
        this.setState({ focusIndex: index });
        if (index !== -1) {
            this.adapter.updateScrollTop(index);
        }
    }

    #handleArrowKeyDown(offset: number) {
        const { visible } = this.getStates();
        if (!visible) {
            this.#openDropdown();
        } else {
            this.#moveFocus(offset);
        }
    }

    #handleEnterKeyDown() {
        const { visible, options, focusIndex } = this.getStates();
        if (!visible) {
            this.#openDropdown();
        } else {
            if (focusIndex !== undefined && focusIndex !== -1 && options.length !== 0) {
                const visibleOptions = options.filter((item: StateOptionItem) => item.show);
                const selectedOption = visibleOptions[focusIndex];
                // hover and defaultActiveFirstOption can highlight a disabled option
                if (selectedOption && !selectedOption.disabled) {
                    this.handleSelect(selectedOption, focusIndex);
                }
            } else {
                this.#closeDropdown();
            }
        }
    }

    #openDropdown() {
        this.setState({ visible: true });
        this.adapter.notifyDropdownVisibleChange(true);
        this.#modifyFocusIndexOnPanelOpen();
    }

    #closeDropdown() {
        // Tab and Escape reach a closed panel; no visibility change to report
        if (!this.getState('visible')) {
            return;
        }
        this.setState({ visible: false });
        this.adapter.notifyDropdownVisibleChange(false);
    }

    #updateSelection(option: DataItem) {
        const selection = new Map<any, DataItem>();
        if (option) {
            selection.set(option.label, option);
        }
        this.setState({ selection });
    }

    #notifySelect(option: DataItem) {
        if (this.#backwardLabelInValue()) {
            this.adapter.notifySelect(option);
        } else {
            this.adapter.notifySelect(option.value);
        }
    }

    protected override initOnce() {
        // a disabled input cannot pick from the list or close it
        if (this.getProp('defaultOpen') && !this.getProp('disabled')) {
            this.#openDropdown();
        }
    }

    static getInitialState(props: AutoCompleteBaseProps): AutoCompleteBaseState {
        const value = props.value !== undefined ? props.value : props.defaultValue;
        return {
            options: AutoCompleteFoundation.#generateList(props.data),
            visible: false,
            ...AutoCompleteFoundation.#valueStates(props, value),
        };
    }

    override handlePropsChange() {
        this.setState(AutoCompleteFoundation.#valueStates(this.getProps(), this.getProp('value'), this.getState('inputValue')));
    }

    handleKeyDown = (event: Pick<KeyboardEvent, 'key' | 'preventDefault'> & Parameters<typeof isComposing>[0]) => {
        // the spinner replaces the list while loading; the options still in state are the previous, hidden batch
        const listHidden = this.getProp('loading') && this.getState('visible');
        switch (isComposing(event) ? '' : event.key) {
            case 'ArrowUp':
                // keep the Input cursor from moving
                event.preventDefault();
                if (!listHidden) {
                    this.#handleArrowKeyDown(-1);
                }
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (!listHidden) {
                    this.#handleArrowKeyDown(1);
                }
                break;
            case 'Enter':
                // with a custom trigger, an outer handler would open the panel again
                event.preventDefault();
                if (!listHidden) {
                    this.#handleEnterKeyDown();
                }
                break;
            case 'Escape':
                // claim the key so the overlay stack does not also close an enclosing dialog
                if (this.getState('visible')) {
                    event.preventDefault();
                }
                this.#closeDropdown();
                break;
            case 'Tab':
                this.#closeDropdown();
                break;
            default:
                break;
        }
        this.adapter.notifyKeyDown(event);
    };

    /** Mousedown outside the input and dropdown while shown */
    handleClickOutside = (_e: MouseEvent) => {
        this.#closeDropdown();
    };

    /**
     * Hides the dropdown and reports dropdownVisibleChange(false), without blurring the input or moving focus.
     * Called when Vue KeepAlive deactivates the host.
     */
    close = () => {
        this.#closeDropdown();
    };

    handleInputClick = (e: Pick<MouseEvent, 'detail' | 'target' | 'currentTarget'>) => {
        const { disabled } = this.getProps();
        // Enter/Space on a custom trigger's button synthesize a click that must not also toggle the list
        if (!disabled && !isInnerControlActivation(e)) {
            if (this.getState('visible')) {
                this.#closeDropdown();
            } else {
                this.#openDropdown();
            }
        }
    };

    handleSearch = (inputValue: string) => {
        this.setState({ inputValue });
        this.adapter.notifySearch(inputValue);
        this.adapter.notifyChange(inputValue);
        this.#modifyFocusIndex(inputValue);
        if (!this.getState('visible')) {
            this.#openDropdown();
        }
    };

    handleSelect = (stateOption: StateOptionItem, optionIndex?: number) => {
        const { renderSelectedItem } = this.getProps();
        const option = AutoCompleteFoundation.#toDataItem(stateOption);

        let newInputValue: string | number = '';
        if (renderSelectedItem && typeof renderSelectedItem === 'function') {
            newInputValue = renderSelectedItem(option);
            warning(typeof newInputValue !== 'string', 'Warning: [Semi AutoComplete] renderSelectedItem must return string, please check your function return');
        } else {
            newInputValue = option.value;
        }

        if (this.isControlledComponent()) {
            this.#closeDropdown();
            this.#notifySelect(option);
        } else {
            this.setState({ inputValue: newInputValue });
            this.#updateSelection(option);
            this.#notifySelect(option);
            this.#closeDropdown();
        }
        this.adapter.notifyChange(newInputValue);
        this.setState({ focusIndex: optionIndex });
    };

    handleDataChange = (newData: any[]) => {
        this.setState({ options: AutoCompleteFoundation.#generateList(newData) });
        let { inputValue } = this.getStates();
        this.#modifyFocusIndex(inputValue);
    };

    handleClear = () => {
        this.adapter.notifyClear();
    };

    handleOptionMouseEnter = (optionIndex: number) => {
        this.setState({ focusIndex: optionIndex });
    };

    handleFocus = (e: FE) => {
        this.adapter.notifyFocus(e);
    };

    handleBlur = (e: FE) => {
        this.adapter.notifyBlur(e);
    };
}
