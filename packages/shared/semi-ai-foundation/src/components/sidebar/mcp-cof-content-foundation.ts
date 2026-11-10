import { throttle } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import { strings } from './constants';

/** Each framework narrows `icon` and `desc` to what it renders and passes its option type as the `O` parameter below */
export interface MCPOption {
    icon?: unknown;
    label?: string;
    /** Identifies the option in onStatusChange and keys its row, so it must be unique */
    value: string;
    desc?: unknown;
    active?: boolean;
    disabled?: boolean;
    configure?: boolean;
}

export interface MCPConfigureContentProps<O extends MCPOption = MCPOption> {
    className?: string;
    options?: O[];
    customOptions?: O[];
    filter?: (inputValue: string, option: O) => boolean;
    placeholder?: string;
    style?: any;
    onStatusChange?: (options: O[], custom: boolean) => void;
    onSearch?: (inputValue: string, custom: boolean) => void;
    onAddClick?: (e: any) => void;
    onConfigureClick?: (e: any, option: O) => void;
    onEditClick?: (e: any, option: O) => void;
    renderItem?: (props: { option: O; custom: boolean }) => any;
}

export type MCPConfigureMode = 'inner' | 'custom';

export interface MCPConfigureContentState {
    mode: MCPConfigureMode;
    inputValue: string;
    /** The search text the list is filtered by; follows `inputValue` through a 300ms throttle */
    query: string;
}

/** E is the host's button click event, which the foundation only passes through */
export interface MCPConfigureContentAdapter<E = unknown, O extends MCPOption = MCPOption> extends DefaultAdapter<MCPConfigureContentProps<O>, MCPConfigureContentState> {
    notifyConfigureClick: (e: E, option: O) => void;
    notifyEditClick: (e: E, option: O) => void;
    notifyStatusChange: (options: O[], custom: boolean) => void;
    notifyAddClick: (e: E) => void;
    notifySearch: (inputValue: string, custom: boolean) => void;
}

export default class MCPConfigureContentFoundation<E = unknown, O extends MCPOption = MCPOption> extends BaseFoundation<MCPConfigureContentAdapter<E, O>, MCPConfigureContentProps<O>, MCPConfigureContentState> {
    #setQuery(value: string) {
        this.setState({ query: value });
    }

    #updateQuery = throttle((value: string) => this.#setQuery(value), 300);

    static getInitialState(): MCPConfigureContentState {
        return { mode: strings.MCP_MODE.INNER, inputValue: '', query: '' };
    }

    override destroy() {
        this.#updateQuery.cancel();
    }

    handleSearch = (value: string) => {
        this.setState({ inputValue: value });
        this.#updateQuery(value);
        this.adapter.notifySearch(value, this.getState('mode') === strings.MCP_MODE.CUSTOM);
    };

    // cancel the pending throttled search so the new mode's list is filtered by the text already typed
    handleModeChange = (mode: MCPConfigureMode) => {
        this.#updateQuery.cancel();
        this.setState({ mode, query: this.getState('inputValue') });
    };

    onConfigureButtonClick = (e: E, option: O) => {
        this.adapter.notifyConfigureClick(e, option);
    };

    onEditButtonClick = (e: E, option: O) => {
        this.adapter.notifyEditClick(e, option);
    };

    handleStatusChange = (item: O, checked: boolean) => {
        const { options = [], customOptions = [] } = this.getProps();
        let newOptions: O[];
        const mode = this.getState('mode');
        if (mode === strings.MCP_MODE.INNER) {
            newOptions = options.map((option) => (option.value === item.value ? { ...option, active: checked } : option));
        } else {
            newOptions = customOptions.map((option) => (option.value === item.value ? { ...option, active: checked } : option));
        }
        this.adapter.notifyStatusChange(newOptions, mode === strings.MCP_MODE.CUSTOM);
    };

    handleAddClick = (e: E) => {
        this.adapter.notifyAddClick(e);
    };
}
