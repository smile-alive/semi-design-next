import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import type { InputProps, ValidateStatus } from '../input/index.js';
import type { PopoverProps } from '../popover/index.js';
import type { TagCloseEvent } from '../tag/index.js';
import type { Position } from '../tooltip/index.js';

export type BasicSelectValue = string | number | Record<string, any>;

/** A single value, an array of them in multiple mode, or option records with `onChangeWithObject` */
export type SelectValue = BasicSelectValue | BasicSelectValue[] | undefined;

export type SelectSize = Size;

export interface SelectVirtualize {
    /** The height of every option row in pixels */
    itemSize: number;
    height?: number;
    width?: string | number;
}

/** Adjacent `optionList` entries with the same `key` form one group; a group without a `label` renders no title */
export interface SelectOptionGroup {
    key: string | number;
    label?: string | number;
}

/** An `optionList` entry, and the option record the callbacks report; any other field rides along */
export interface SelectOptionProps {
    value?: string | number;
    label?: string | number;
    disabled?: boolean;
    showTick?: boolean;
    /** The group this entry belongs to; entries of one group must be adjacent. Group titles are not rendered with `virtualize` */
    group?: SelectOptionGroup;
    /** On the option row */
    class?: ClassValue;
    /** On the option row */
    style?: string;
    [key: string]: any;
}

/** The search input's extra props; `class` and `style` land on the Input wrapper */
export type SelectInputProps = Omit<InputProps, 'value'>;

export interface SelectOptionItemSnippetProps {
    /** Put it on the role="option" element: the combobox's aria-activedescendant points at it */
    id: string;
    value?: string | number;
    label?: string | number;
    selected: boolean;
    focused: boolean;
    disabled?: boolean;
    inputValue: string;
    class: ClassValue;
    style?: string;
    onclick: (event: MouseEvent) => void;
    onmouseenter: (event: MouseEvent) => void;
    [key: string]: unknown;
}

export interface SelectOptionLabelSnippetProps {
    option: SelectOptionProps;
}

export interface SelectGroupLabelSnippetProps {
    group: SelectOptionGroup;
}

export interface SelectCreateItemSnippetProps {
    inputValue: string;
    focus: boolean;
    /** The virtual list's row position */
    style?: string;
}

export interface SelectSelectedItemSnippetProps {
    option: SelectOptionProps;
    index: number;
    disabled: boolean;
    /** Removes the option; in single mode clears the value */
    onClose: (event?: TagCloseEvent) => void;
}

export interface SelectTriggerSnippetProps {
    value: SelectOptionProps[];
    inputValue: string;
    placeholder?: string;
    disabled: boolean;
    /** Updates the search keyword */
    onSearch: (inputValue: string) => void;
    /** Pass the click event when bound to a control inside the trigger, so the click does not open the list */
    onClear: (event?: MouseEvent) => void;
    onRemove: (option: SelectOptionProps) => void;
}

// The trigger is the landing element; its lowercase listeners that share a meaning with a callback below give way to it
type NativeKeys = 'children' | 'prefix' | 'placeholder' | 'onchange' | 'onselect' | 'onfocus' | 'onblur';

export interface SelectProps extends Omit<HTMLAttributes<HTMLDivElement>, NativeKeys> {
    /** Bindable; leave it out for an uncontrolled Select. `bind:value={get, set}` makes it fully controlled */
    value?: SelectValue;
    multiple?: boolean;
    optionList?: SelectOptionProps[];
    filter?: boolean | ((inputValue: string, option: SelectOptionProps) => boolean);
    remote?: boolean;
    allowCreate?: boolean;
    autoClearSearchValue?: boolean;
    autofocus?: boolean;
    /** Opens the list on mount; Select has no controlled open state */
    defaultOpen?: boolean;
    clickToHide?: boolean;
    defaultActiveFirstOption?: boolean;
    /** `onChange` and `value` carry option records instead of values */
    onChangeWithObject?: boolean;
    max?: number;
    maxTagCount?: number;
    maxHeight?: string | number;
    showRestTagsPopover?: boolean;
    restTagsPopoverProps?: PopoverProps;
    expandRestTagsOnClick?: boolean;
    ellipsisTrigger?: boolean;
    size?: SelectSize;
    disabled?: boolean;
    borderless?: boolean;
    validateStatus?: ValidateStatus;
    placeholder?: string;
    searchPlaceholder?: string;
    searchPosition?: 'trigger' | 'dropdown';
    loading?: boolean;
    showArrow?: boolean;
    showClear?: boolean;
    insetLabelId?: string;
    inputProps?: SelectInputProps;
    dropdownClassName?: string;
    dropdownStyle?: string;
    dropdownMatchSelectWidth?: boolean;
    position?: Position;
    spacing?: number | { x: number; y: number };
    motion?: boolean;
    autoAdjustOverflow?: boolean;
    stopPropagation?: boolean;
    virtualize?: SelectVirtualize;
    preventScroll?: boolean;
    /** Id of the trigger; the option ids derive from it */
    id?: string;
    onChange?: (value: SelectValue) => void;
    onDropdownVisibleChange?: (visible: boolean) => void;
    /** No event when called through `search()` or the trigger snippet's `onSearch` */
    onSearch?: (value: string, event?: Event) => void;
    onSelect?: (value: string | number, option: SelectOptionProps) => void;
    onDeselect?: (value: string | number, option: SelectOptionProps) => void;
    onExceed?: (option: SelectOptionProps) => void;
    onCreate?: (option: SelectOptionProps) => void;
    onClear?: () => void;
    /** Once when the focus enters the Select */
    onFocus?: (event: FocusEvent) => void;
    /** Once when the focus leaves the Select; a press outside the open dropdown passes its mousedown event */
    onBlur?: (event: FocusEvent | MouseEvent) => void;
    onListScroll?: (event: Event) => void;
    prefix?: Snippet;
    suffix?: Snippet;
    insetLabel?: Snippet;
    arrowIcon?: Snippet;
    clearIcon?: Snippet;
    /** `null` hides the empty state */
    emptyContent?: Snippet | null;
    outerTopSlot?: Snippet;
    innerTopSlot?: Snippet;
    outerBottomSlot?: Snippet;
    innerBottomSlot?: Snippet;
    /** Replaces a whole option row */
    optionItem?: Snippet<[SelectOptionItemSnippetProps]>;
    /** Replaces the text of each option row; the row, its tick and its keyboard behavior stay. Search keywords are not highlighted */
    optionLabel?: Snippet<[SelectOptionLabelSnippetProps]>;
    /** Replaces the title of each group; the title text defaults to `group.label` */
    groupLabel?: Snippet<[SelectGroupLabelSnippetProps]>;
    /** Content of the row that creates an option from the keyword */
    createItem?: Snippet<[SelectCreateItemSnippetProps]>;
    /** The selected content in single mode, the content of each tag in multiple mode */
    selectedItem?: Snippet<[SelectSelectedItemSnippetProps]>;
    /** Replaces each tag in multiple mode */
    tag?: Snippet<[SelectSelectedItemSnippetProps]>;
    /** Replaces the trigger content */
    trigger?: Snippet<[SelectTriggerSnippetProps]>;
}
