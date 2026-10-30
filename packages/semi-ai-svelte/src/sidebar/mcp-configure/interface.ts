import type { Snippet } from 'svelte';
import type { MCPOption } from '@fibrae/semi-ai-foundation/sidebar/mcp-cof-content-foundation';
import type { ContainerProps } from '../container/interface.js';

export interface MCPConfigureOption extends MCPOption {
    /** Image URL; use the `icon` snippet for other content */
    icon?: string;
    /** Plain text; use the `desc` snippet for other content. The built-in filter searches it with the label */
    desc?: string;
}

export interface MCPConfigureItemSnippetProps {
    item: MCPConfigureOption;
    index: number;
    /** Whether the custom list is shown */
    custom: boolean;
}

export interface MCPConfigureContentProps {
    /** Bindable; switching an inner option writes the new list back before `onStatusChange` */
    options?: MCPConfigureOption[];
    /** Bindable; switching a custom option writes the new list back before `onStatusChange` */
    customOptions?: MCPConfigureOption[];
    /** Receives the lower-cased input; by default the label and desc are searched */
    filter?: (inputValue: string, option: MCPConfigureOption) => boolean;
    placeholder?: string;
    /** The switched list, inner or custom, with the option's `active` flipped */
    onStatusChange?: (options: MCPConfigureOption[], custom: boolean) => void;
    onSearch?: (inputValue: string, custom: boolean) => void;
    onAddClick?: (event: MouseEvent) => void;
    onConfigureClick?: (event: MouseEvent, option: MCPConfigureOption) => void;
    onEditClick?: (event: MouseEvent, option: MCPConfigureOption) => void;
    icon?: Snippet<[MCPConfigureItemSnippetProps]>;
    desc?: Snippet<[MCPConfigureItemSnippetProps]>;
    /** Replaces the whole built-in row */
    item?: Snippet<[MCPConfigureItemSnippetProps]>;
}

// placeholder belongs to the search input
export interface MCPConfigureProps extends Omit<ContainerProps, 'onsearch' | 'placeholder' | 'children'>, MCPConfigureContentProps {}
