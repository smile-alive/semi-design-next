import { For, type JSX, Show, mergeProps, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import Button from '@fibrae/semi-ui-solid/button/index';
import Dropdown, { type DropdownProps } from '@fibrae/semi-ui-solid/dropdown/index';
import { useLocale } from '@fibrae/semi-ui-solid/hooks';

const prefix = cssClasses.PREFIX;

/** Data only; the menu icon comes from `renderOptionIcon` */
export interface McpOption {
    value: string;
    label: string;
    [key: string]: unknown;
}

export interface McpProps extends Omit<DropdownProps, 'children' | 'render'> {
    options: McpOption[];
    num?: number;
    showConfigure?: boolean;
    onConfigureButtonClick?: () => void;
    /** The icon of each built-in menu item */
    renderOptionIcon?: (option: McpOption) => JSX.Element;
    /** The menu under the header, in place of the one built from `options` */
    children?: JSX.Element;
}

export default function Mcp(rawProps: McpProps) {
    const props = mergeProps({ options: [] as McpOption[], showConfigure: true }, rawProps);
    const [local, rest] = splitProps(props, ['class', 'options', 'num', 'children', 'onConfigureButtonClick', 'showConfigure', 'renderOptionIcon']);

    const locale = useLocale('AIChatInput');

    const count = () => local.num ?? local.options.length;

    // keep the click from reaching the Dropdown trigger, which would close the menu
    const handleClick = (e: MouseEvent) => e.stopPropagation();

    return (
        <Dropdown
            class={clsx(local.class, `${prefix}-footer-configure-mcp`)}
            {...rest}
            render={
                <>
                    <div class={`${prefix}-footer-configure-mcp-header`}>
                        <span class={`${prefix}-footer-configure-mcp-header-title`}>{locale().locale.selected.replace('${count}', String(count()))}</span>
                        <Show when={local.showConfigure}>
                            <Button class={`${prefix}-footer-configure-mcp-header-config`} theme="outline" onClick={() => local.onConfigureButtonClick?.()}>
                                {locale().locale.configure}
                            </Button>
                        </Show>
                    </div>
                    {local.children ?? (
                        <Dropdown.Menu>
                            <For each={local.options}>{(item) => <Dropdown.Item icon={local.renderOptionIcon?.(item)}>{item.label}</Dropdown.Item>}</For>
                        </Dropdown.Menu>
                    )}
                </>
            }
        >
            {(getTriggerProps) => (
                <Button {...getTriggerProps({ class: `${prefix}-footer-configure-mcp-trigger`, onClick: handleClick })} type="tertiary" theme="outline">
                    MCP · {count()}
                </Button>
            )}
        </Dropdown>
    );
}
