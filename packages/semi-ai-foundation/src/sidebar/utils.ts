import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import { cssClasses, strings } from './constants';
import type { MCPConfigureMode, MCPOption } from './mcp-cof-content-foundation';

// Switching views unmounts the pressed button, which drops focus to the body (WCAG 2.4.3); focus the user moved elsewhere stays
export function focusAfterModeChange(container: HTMLElement | null | undefined, isMain: boolean) {
    const active = document.activeElement;
    if (!container || (active && active !== document.body)) {
        return;
    }
    const preferred = container.querySelector<HTMLElement>(isMain ? `.${cssClasses.OPTIONS} [aria-pressed="true"]` : `.${cssClasses.SIDEBAR}-detail-header-left button`);
    (preferred ?? FocusTrapHandle.getFocusableElements(container)[0])?.focus();
}

// Focus the user moved to the page beside the sidebar stays there; checking inside through root's own tree also holds in a shadow root
export function canRestoreFocus(root?: HTMLElement | null) {
    return FocusTrapHandle.shouldRestoreFocus(root, false);
}

// Computed while rendering so option and filter changes apply at once
export function getShowOptions<T extends MCPOption>({ options = [], customOptions = [], filter }: { options?: T[]; customOptions?: T[]; filter?: (value: string, option: T) => boolean }, mode: MCPConfigureMode, query: string) {
    const list = mode === strings.MCP_MODE.INNER ? options : customOptions;
    return query ? getFilterResult(query, list, filter) : list;
}

export function getFilterResult<T extends MCPOption>(inputValue: string, options: T[] = [], customFilter?: (value: string, option: T) => boolean) {
    const lowCaseInputValue = inputValue.toLowerCase();
    const filteredOptions = options.filter((option) => {
        if (typeof customFilter === 'function') {
            return customFilter(lowCaseInputValue, option);
        } else {
            return baseFilter(lowCaseInputValue, option);
        }
    });
    return filteredOptions;
}

export function baseFilter(value: string, option: MCPOption) {
    const labelText = typeof option.label === 'string' ? option.label : '';
    if (labelText.toLowerCase().includes(value)) {
        return true;
    }
    const descText = typeof option.desc === 'string' ? option.desc : '';
    return descText.toLowerCase().includes(value);
}
