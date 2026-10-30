import type { Snippet } from 'svelte';
import type { LeftMenuChangeProps } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
import type { ButtonProps } from '@fibrae/semi-ui-svelte/button/index';
import type { DropdownProps } from '@fibrae/semi-ui-svelte/dropdown/index';
import type { RadioGroupProps, RadioValue } from '@fibrae/semi-ui-svelte/radio/index';
import type { SelectProps, SelectValue } from '@fibrae/semi-ui-svelte/select/index';

export interface ConfigureProps {
    /** The value the items start from; each item's `initValue` is merged on top when it mounts */
    defaultValue?: LeftMenuChangeProps;
    /** `changedValue` is undefined when an item is removed */
    onChange?: (value: LeftMenuChangeProps, changedValue?: LeftMenuChangeProps) => void;
    children?: Snippet;
}

export interface ConfigureHandle {
    /** The current value of every item */
    getConfigureValue: () => LeftMenuChangeProps;
}

/** What every item declares itself; the rest goes to the wrapped component */
export interface ConfigureItemOwnProps<V> {
    /** The key of this item in the Configure value */
    field: string;
    /** Seeds the field when the item is mounted */
    initValue?: V;
    onChange?: (value: V) => void;
}

export type ConfigureSelectProps = Omit<SelectProps, 'value' | 'onChange'> & ConfigureItemOwnProps<SelectValue>;

export type ConfigureRadioButtonProps = Omit<RadioGroupProps, 'value' | 'onChange'> & ConfigureItemOwnProps<RadioValue | undefined>;

export interface ConfigureButtonProps extends Omit<ButtonProps, 'onclick' | 'value'>, ConfigureItemOwnProps<boolean> {
    /** The value after the toggle */
    onClick?: (value: boolean) => void;
}

export interface McpOption {
    value: string;
    label: string;
    disabled?: boolean;
    [key: string]: unknown;
}

export interface McpOptionIconSnippetProps {
    item: McpOption;
    index: number;
}

/** The Dropdown props fall through to the Dropdown */
export interface McpProps extends Omit<DropdownProps, 'children' | 'child' | 'content' | 'menu' | 'menuIcon'> {
    options: McpOption[];
    /** The count shown on the trigger and in the header, the number of options by default */
    num?: number;
    showConfigure?: boolean;
    onConfigureButtonClick?: () => void;
    /** Replaces the built-in menu below the header */
    children?: Snippet;
    optionIcon?: Snippet<[McpOptionIconSnippetProps]>;
}
