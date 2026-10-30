import type React from 'react';
import type { MouseEvent, ReactNode } from 'react';
import clsx from 'clsx';
import { cssClasses, getTabDataKey } from '@fibrae/semi-foundation/tabs/constants';
import { IconClose } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../_base/base';
import useLocale from '../locale/use-locale';
import { getPanelId, getTabId } from './ids';
import type { TabType, TabSize, TabPosition } from './interface';
import { useTabsContext } from './tabs-context';

export interface TabItemProps extends ElementProps<'div', 'onClick'> {
    tab?: ReactNode;
    icon?: ReactNode;
    size?: TabSize;
    type?: TabType;
    tabPosition?: TabPosition;
    selected?: boolean;
    closable?: boolean;
    disabled?: boolean;
    itemKey?: string;
    handleKeyDown?: (event: React.KeyboardEvent, itemKey: string, closable: boolean) => void;
    deleteTabItem?: (tabKey: string, event: MouseEvent) => void;
    onClick?: (itemKey: string, e: MouseEvent) => void;
    /** Attached to the tab element; OverflowList (collapsible Tabs) measures the tab through it */
    ref?: React.Ref<HTMLDivElement>;
    className?: string;
}

export default function TabItem({ ref, tab, size, type, icon, selected, closable, disabled, itemKey, deleteTabItem, tabPosition, handleKeyDown, onClick, className: userClassName, ...restProps }: TabItemProps) {
    const { tabsId, everyPanelMounted, type: contextType, tabPosition: contextTabPosition, deleteTabItem: contextDeleteTabItem, handleKeyDown: contextHandleKeyDown, tabbableKey } = useTabsContext();
    const { locale } = useLocale('Tabs');

    const tabType = type ?? contextType;
    const position = tabPosition ?? contextTabPosition;
    const handleDelete = deleteTabItem ?? contextDeleteTabItem;

    // the foundation finds the sibling tabs through the closest role="tablist", so a custom bar must render one
    const handleKey = handleKeyDown ?? contextHandleKeyDown;

    // outside Tabs there is no panel to point to, and with a single mounted panel only the active tab has one
    const ids = tabsId
        ? {
              id: getTabId(tabsId, itemKey),
              'aria-controls': everyPanelMounted || selected ? getPanelId(tabsId, itemKey) : undefined,
          }
        : null;

    const className = clsx(
        cssClasses.TABS_TAB,
        `${cssClasses.TABS_TAB}-single`,
        {
            [`${cssClasses.TABS_TAB}-${tabType}`]: tabType,
            [`${cssClasses.TABS_TAB}-${position}`]: position,
            [cssClasses.TABS_TAB_ACTIVE]: selected,
            [cssClasses.TABS_TAB_DISABLED]: disabled,
            [`${cssClasses.TABS_TAB}-small`]: size === 'small',
            [`${cssClasses.TABS_TAB}-medium`]: size === 'medium',
        },
        userClassName
    );

    return (
        <div
            {...restProps}
            role="tab"
            {...ids}
            ref={ref}
            className={className}
            data-tabkey={getTabDataKey(itemKey)}
            aria-disabled={disabled ? 'true' : 'false'}
            aria-selected={selected ? 'true' : 'false'}
            tabIndex={selected || itemKey === tabbableKey ? 0 : -1}
            onClick={(e) => {
                if (!disabled) {
                    onClick?.(itemKey, e);
                }
            }}
            onKeyDown={(event) => {
                restProps.onKeyDown?.(event);
                handleKey?.(event, itemKey, closable);
            }}
        >
            {Boolean(icon) && <span className={`${cssClasses.TABS_BAR}-icon`}>{icon}</span>}
            {tab}
            {closable && (
                <IconClose
                    className={`${cssClasses.TABS_TAB}-icon-close`}
                    aria-label={locale.close}
                    role="button"
                    onClick={(e: MouseEvent<HTMLSpanElement>) => {
                        if (!disabled) {
                            handleDelete?.(itemKey, e);
                        }
                    }}
                />
            )}
        </div>
    );
}
