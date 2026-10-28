import type { VNode } from 'vue';
import type { MCPOption } from '@fibrae/semi-ai-foundation/sidebar/mcp-cof-content-foundation';
import type { ContainerEmits, ContainerProps } from '../container/interface';

export interface MCPConfigureOption extends MCPOption {
    /** Image URL; use the `#icon` slot for other content */
    icon?: string;
    /** Plain text; use the `#desc` slot for other content. The built-in filter searches it with the label */
    desc?: string;
}

export interface MCPConfigureContentProps {
    options?: MCPConfigureOption[];
    customOptions?: MCPConfigureOption[];
    /** Receives the lower-cased input; by default the label and desc are searched */
    filter?: (inputValue: string, option: MCPConfigureOption) => boolean;
    placeholder?: string;
}

export interface MCPConfigureContentEmits {
    /** Emitted before `statusChange` when an inner option is switched, so `v-model:options` follows */
    'update:options': [options: MCPConfigureOption[]];
    /** Emitted before `statusChange` when a custom option is switched, so `v-model:customOptions` follows */
    'update:customOptions': [options: MCPConfigureOption[]];
    /** The switched list, inner or custom, with the option's `active` flipped */
    statusChange: [options: MCPConfigureOption[], custom: boolean];
    search: [inputValue: string, custom: boolean];
    addClick: [event: MouseEvent];
    configureClick: [event: MouseEvent, option: MCPConfigureOption];
    editClick: [event: MouseEvent, option: MCPConfigureOption];
}

export interface MCPConfigureItemSlotProps {
    item: MCPConfigureOption;
    index: number;
    /** Whether the custom list is shown */
    custom: boolean;
}

export interface MCPConfigureContentSlots {
    icon?: (props: MCPConfigureItemSlotProps) => VNode[];
    desc?: (props: MCPConfigureItemSlotProps) => VNode[];
    /** Replaces the whole built-in row */
    item?: (props: MCPConfigureItemSlotProps) => VNode[];
}

export interface MCPConfigureProps extends ContainerProps, MCPConfigureContentProps {}

export interface MCPConfigureEmits extends ContainerEmits, MCPConfigureContentEmits {}

export interface MCPConfigureSlots extends MCPConfigureContentSlots {
    title?: () => VNode[];
    /** Replaces the container header; empty content falls back to the default header */
    header?: () => VNode[];
}
