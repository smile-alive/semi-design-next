import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import type { PopoverProps } from '../popover/index.js';
import type { TypographyShowTooltip as ShowTooltip } from '../typography/index.js';

export type TagInputSize = Size;
export type TagInputValidateStatus = 'default' | 'error' | 'warning';
/** The `+N` popover shows the rest tags itself, so its trigger and content are not configurable */
export type RestTagsPopoverProps = Omit<PopoverProps, 'children' | 'child' | 'content'>;

export interface TagInputTagSnippetProps {
    value: string;
    index: number;
    /** Removes the tag; a given event has its default prevented, so a Tag wired to it does not hide itself */
    onClose: (event?: Event) => void;
}

// The lowercase listeners are the camelCase callbacks below. Everything else undeclared lands on the root, except the
// control attributes (id, name, role, tabindex, aria-*), which describe the text input.
type NativeRootKeys = 'children' | 'draggable' | 'prefix' | 'onchange' | 'onfocus' | 'onblur' | 'onkeydown';

export interface TagInputProps extends Omit<HTMLAttributes<HTMLDivElement>, NativeRootKeys> {
    /** The tags, bindable; leave it out for an uncontrolled input. `null` means controlled with no tags. `bind:value={get, set}` makes it fully controlled */
    value?: string[] | null;
    /** The input text, bindable; leave it out for an uncontrolled text. `bind:inputValue={get, set}` makes it fully controlled */
    inputValue?: string;
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
    onChange?: (value: string[]) => void;
    /**
     * The event is an input Event (typing), a KeyboardEvent (Enter adds), a FocusEvent (addOnBlur), a MouseEvent
     * (clear) or a CompositionEvent (IME truncation); narrow it by `event.type` before reading its own fields
     */
    onInputChange?: (value: string, event: Event) => void;
    onAdd?: (addedValue: string[]) => void;
    onRemove?: (removedValue: string, index: number) => void;
    /** The whole list before it is cut to `max` */
    onExceed?: (value: string[]) => void;
    onInputExceed?: (value: string) => void;
    /** focusin on the root, once when the focus comes from outside the TagInput */
    onFocus?: (event: FocusEvent) => void;
    /** focusout on the root, once when the focus leaves the whole TagInput */
    onBlur?: (event: FocusEvent) => void;
    /** keydown in the input, after the TagInput handled it */
    onKeyDown?: (event: KeyboardEvent) => void;
    prefix?: Snippet;
    suffix?: Snippet;
    insetLabel?: Snippet;
    /** Replaces the clear icon */
    clearIcon?: Snippet;
    /** Replaces each tag as a whole */
    tag?: Snippet<[TagInputTagSnippetProps]>;
}
