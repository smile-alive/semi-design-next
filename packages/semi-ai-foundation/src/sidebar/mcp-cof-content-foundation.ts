import { throttle } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import { strings } from './constants';

export interface MCPOption {
    icon?: any;
    label?: string;
    /** Identifies the option in onStatusChange and keys its row, so it must be unique */
    value: string;
    desc?: any;
    active?: boolean;
    disabled?: boolean;
    configure?: boolean;
}

export interface MCPConfigureContentProps {
    className?: string;
    options?: MCPOption[];
    customOptions?: MCPOption[];
    filter?: (inputValue: string, option: MCPOption) => boolean;
    placeholder?: string;
    style?: any;
    onStatusChange?: (options: MCPOption[], custom: boolean) => void;
    onSearch?: (inputValue: string, custom: boolean) => void;
    onAddClick?: (e: any) => void;
    onConfigureClick?: (e: any, option: MCPOption) => void;
    onEditClick?: (e: any, option: MCPOption) => void;
    renderItem?: (props: { option: MCPOption; custom: boolean }) => any;
}

export type MCPConfigureMode = 'inner' | 'custom';

export interface MCPConfigureContentState {
    mode: MCPConfigureMode;
    inputValue: string;
    /** The search text the list is filtered by; follows `inputValue` through a 300ms throttle */
    query: string;
}

/** E is the host's button click event, which the foundation only passes through */
export interface MCPConfigureContentAdapter<E = unknown> extends DefaultAdapter<MCPConfigureContentProps, MCPConfigureContentState> {
    notifyConfigureClick: (e: E, option: MCPOption) => void;
    notifyEditClick: (e: E, option: MCPOption) => void;
    notifyStatusChange: (options: MCPOption[], custom: boolean) => void;
    notifyAddClick: (e: E) => void;
    notifySearch: (inputValue: string, custom: boolean) => void;
}

export default class MCPConfigureContentFoundation<E = unknown> extends BaseFoundation<MCPConfigureContentAdapter<E>, MCPConfigureContentProps, MCPConfigureContentState> {
    #setQuery(value: string) {
        this.setState({ query: value });
    }

    #updateQuery = throttle((value: string) => this.#setQuery(value), 300);

    override destroy() {
        this.#updateQuery.cancel();
    }

    handleSearch = (value: string) => {
        this.setState({ inputValue: value });
        this.#updateQuery(value);
        this._adapter.notifySearch(value, this.getState('mode') === strings.MCP_MODE.CUSTOM);
    };

    // cancel the pending throttled search so the new mode's list is filtered by the text already typed
    handleModeChange = (mode: MCPConfigureMode) => {
        this.#updateQuery.cancel();
        this.setState({ mode, query: this.getState('inputValue') });
    };

    onConfigureButtonClick = (e: E, option: MCPOption) => {
        this._adapter.notifyConfigureClick(e, option);
    };

    onEditButtonClick = (e: E, option: MCPOption) => {
        this._adapter.notifyEditClick(e, option);
    };

    handleStatusChange = (item: MCPOption, checked: boolean) => {
        const { options = [], customOptions = [] } = this.getProps();
        let newOptions = [];
        const mode = this.getState('mode');
        if (mode === strings.MCP_MODE.INNER) {
            newOptions = options.map((option) => (option.value === item.value ? { ...option, active: checked } : option));
        } else {
            newOptions = customOptions.map((option) => (option.value === item.value ? { ...option, active: checked } : option));
        }
        this._adapter.notifyStatusChange(newOptions, mode === strings.MCP_MODE.CUSTOM);
    };

    handleAddClick = (e: E) => {
        this._adapter.notifyAddClick(e);
    };
}
