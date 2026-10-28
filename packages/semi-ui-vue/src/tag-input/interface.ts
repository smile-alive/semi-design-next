import type { VNode } from 'vue';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import type { ModelModifiers } from '../input/interface';
import type { PopoverProps } from '../popover/interface';
import type { ShowTooltip } from '../typography/interface';

export type TagInputSize = Size;
export type TagInputValidateStatus = 'default' | 'error' | 'warning';
export type RestTagsPopoverProps = PopoverProps;

/** The `focus` and `blur` methods on a TagInput ref; the root element is not exposed */
export interface TagInputHandle {
    focus(): void;
    blur(): void;
}

export interface TagInputProps {
    /** The tags, for `v-model`; `null` means controlled with no tags */
    modelValue?: string[] | null;
    defaultValue?: string[];
    /** The input text, for `v-model:inputValue` */
    inputValue?: string;
    inputValueModifiers?: ModelModifiers;
    disabled?: boolean;
    /** Maximum length of one tag */
    maxLength?: number;
    /** Maximum number of tags */
    max?: number;
    maxTagCount?: number;
    showRestTagsPopover?: boolean;
    restTagsPopoverProps?: RestTagsPopoverProps;
    showContentTooltip?: boolean | ShowTooltip;
    allowDuplicates?: boolean;
    addOnBlur?: boolean;
    draggable?: boolean;
    expandRestTagsOnClick?: boolean;
    placeholder?: string;
    insetLabelId?: string;
    separator?: string | string[] | null;
    showClear?: boolean;
    size?: TagInputSize;
    split?: (originString: string, separators: string | string[] | null) => string[];
    validateStatus?: TagInputValidateStatus;
    /** Focuses the input on mount, with `preventScroll` */
    autofocus?: boolean;
    preventScroll?: boolean;
}

export interface TagInputEmits {
    'update:modelValue': [value: string[]];
    change: [value: string[]];
    'update:inputValue': [value: string];
    /**
     * The event is an input Event (typing), a KeyboardEvent (Enter adds), a FocusEvent (addOnBlur), a MouseEvent
     * (clear) or a CompositionEvent (IME truncation); narrow it by `event.type` before reading its own fields
     */
    inputChange: [value: string, event: Event];
    add: [addedValue: string[]];
    remove: [removedValue: string, index: number];
    /** The whole list before it is cut to `max` */
    exceed: [value: string[]];
    inputExceed: [value: string];
    /** focusin on the root, once when the focus comes from outside the TagInput */
    focus: [event: FocusEvent];
    /** focusout on the root, once when the focus leaves the whole TagInput */
    blur: [event: FocusEvent];
    /** keydown in the input, after the TagInput handled it */
    keydown: [event: KeyboardEvent];
}

export interface TagInputTagSlotProps {
    value: string;
    index: number;
    /** Removes the tag; a given event has its default prevented, so a Tag wired to it does not hide itself */
    onClose: (event?: Event) => void;
}

export interface TagInputSlots {
    prefix?: () => VNode[];
    suffix?: () => VNode[];
    insetLabel?: () => VNode[];
    /** Replaces the clear icon; empty content keeps the default icon */
    clearIcon?: () => VNode[];
    /** Replaces each tag as a whole; empty content renders no tag */
    tag?: (props: TagInputTagSlotProps) => VNode[];
}
