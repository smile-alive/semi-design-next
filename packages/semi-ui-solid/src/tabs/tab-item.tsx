import { children, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, getPanelId, getTabDataKey, getTabId } from '@fibrae/semi-foundation/tabs/constants';
import { IconClose } from '@fibrae/semi-icons-solid';
import callHandler from '../_base/call-handler';
import hasContent from '../_base/has-content';
import useLocale from '../locale/use-locale';
import { useTabsContext } from './context';
import type { TabItemProps } from './interface';

export default function TabItem(props: TabItemProps) {
    const [local, rest] = splitProps(props, ['class', 'closable', 'deleteTabItem', 'disabled', 'handleKeyDown', 'icon', 'itemKey', 'onClick', 'onKeyDown', 'selected', 'size', 'tab', 'tabPosition', 'type']);

    const ctx = useTabsContext();
    const locale = useLocale('Tabs');

    const icon = children(() => local.icon);

    const itemKey = () => local.itemKey ?? '';

    const type = () => local.type ?? ctx?.view().type;

    const tabPosition = () => local.tabPosition ?? ctx?.view().tabPosition;

    // outside Tabs there is no panel to point to, and with a single mounted panel only the active tab has one
    const controls = () => (ctx && (ctx.view().everyPanelMounted || local.selected) ? getPanelId(ctx.view().tabsId, itemKey()) : undefined);

    const handleClick = (event: MouseEvent) => {
        if (!local.disabled) {
            local.onClick?.(itemKey(), event);
        }
    };

    const handleKeyDown = (event: KeyboardEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onKeyDown, event);
        (local.handleKeyDown ?? ctx?.handleKeyDown)?.(event, itemKey(), Boolean(local.closable));
    };

    const handleClose = (event: MouseEvent) => {
        if (!local.disabled) {
            (local.deleteTabItem ?? ctx?.deleteTabItem)?.(itemKey(), event);
        }
    };

    return (
        <div
            {...rest}
            role="tab"
            id={ctx ? getTabId(ctx.view().tabsId, itemKey()) : undefined}
            aria-controls={controls()}
            aria-selected={local.selected ? 'true' : 'false'}
            aria-disabled={local.disabled ? 'true' : 'false'}
            class={clsx(
                cssClasses.TABS_TAB,
                `${cssClasses.TABS_TAB}-single`,
                {
                    [`${cssClasses.TABS_TAB}-${type()}`]: type(),
                    [`${cssClasses.TABS_TAB}-${tabPosition()}`]: tabPosition(),
                    [cssClasses.TABS_TAB_ACTIVE]: local.selected,
                    [cssClasses.TABS_TAB_DISABLED]: local.disabled,
                    [`${cssClasses.TABS_TAB}-small`]: local.size === 'small',
                    [`${cssClasses.TABS_TAB}-medium`]: local.size === 'medium',
                },
                local.class
            )}
            // the foundation finds the sibling tabs through the closest role="tablist" and this attribute
            data-tabkey={getTabDataKey(itemKey())}
            tabIndex={local.selected || itemKey() === ctx?.view().tabbableKey ? 0 : -1}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            <Show when={hasContent(icon())}>
                <span class={`${cssClasses.TABS_BAR}-icon`}>{icon()}</span>
            </Show>
            {local.tab}
            <Show when={local.closable}>
                <IconClose class={`${cssClasses.TABS_TAB}-icon-close`} role="button" aria-label={locale().locale.close} onClick={handleClose} />
            </Show>
        </div>
    );
}
