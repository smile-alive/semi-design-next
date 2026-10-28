import type { AllowedComponentProps, VNode, VNodeProps } from 'vue';
import type { LeftMenuChangeProps } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';

export interface ConfigureProps {
    /** The value the items start from; each item's `initValue` is merged on top when it mounts */
    defaultValue?: LeftMenuChangeProps;
}

export interface ConfigureEmits {
    /** `changedValue` is undefined when an item is removed */
    change: [value: LeftMenuChangeProps, changedValue?: LeftMenuChangeProps];
}

export interface ConfigureSlots {
    default?: () => VNode[];
}

export interface ConfigureHandle {
    /** The current value of every item */
    getConfigureValue: () => LeftMenuChangeProps;
}

// vue-tsc types a generic SFC's props with a Record<string, unknown> fallback; Omit over an index signature would keep
// only that signature and drop every declared prop
type DeclaredKeys<P> = { [K in keyof P as string extends K ? never : K]: P[K] };

/** The props a component declares: the `$props` of an SFC or defineComponent, or the first parameter of a function */
export type PropsOf<C> = DeclaredKeys<C extends new (...args: any) => { $props: infer P } ? P : C extends (props: infer P, ...rest: any) => any ? P : never>;

export interface ConfigureItemOpts<P, VK extends keyof P, CK extends keyof P> {
    /** The prop that receives the value, `modelValue` by default */
    valueKey?: VK;
    /** The listener called with the new value, `onUpdate:modelValue` by default */
    onKeyChangeFnName?: CK;
    className?: string;
    defaultProps?: Partial<P>;
}

export type ConfigureItemProps<P, VK extends keyof P, CK extends keyof P> = Omit<P, VK | CK | 'onChange' | keyof VNodeProps | keyof AllowedComponentProps> & {
    /** The key of this item in the Configure value */
    field: string;
    initValue?: P[VK];
};

export interface McpOption {
    value: string;
    label: string;
    disabled?: boolean;
    [key: string]: unknown;
}

/** The Dropdown props and `class`, `style` fall through to the Dropdown */
export interface McpProps {
    options: McpOption[];
    /** The count shown on the trigger and in the header, the number of options by default */
    num?: number;
    showConfigure?: boolean;
}

export interface McpEmits {
    configureButtonClick: [];
}

export interface McpOptionIconSlotProps {
    item: McpOption;
    index: number;
}

export interface McpSlots {
    /** Replaces the built-in menu below the header */
    default?: () => VNode[];
    optionIcon?: (props: McpOptionIconSlotProps) => VNode[];
}
