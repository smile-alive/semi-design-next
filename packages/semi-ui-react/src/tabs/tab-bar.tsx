import { type CSSProperties, type ReactElement, type ReactNode, isValidElement, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
// compat pick also copies inherited properties of user-provided tabList items
import { pick } from 'es-toolkit/compat';
import { cssClasses, getBarItemKey } from '@fibrae/semi-foundation/tabs/constants';
import TabsFoundation from '@fibrae/semi-foundation/tabs/foundation';
import { IconChevronRight, IconChevronLeft, IconChevronDown } from '@fibrae/semi-icons-react';
import useDidUpdate from '../_base/use-did-update';
import useMergedRef from '../_base/use-merged-ref';
import Button from '../button';
import Dropdown, { type DropdownProps } from '../dropdown';
import useLocale from '../locale/use-locale';
import OverflowList from '../overflow-list';
import ReactResizeObserver from '../resize-observer';
import { getTabId } from './ids';
import type { TabBarProps, PlainTab } from './interface';
import TabItem from './tab-item';
import { TabsContext, useTabsContext } from './tabs-context';

export interface OverflowItem extends PlainTab {
    key: string;
    active: boolean;
}

export default function TabBar({
    activeKey,
    className,
    collapsible,
    list,
    onTabClick,
    showRestInDropdown,
    size,
    style,
    tabBarExtraContent,
    tabPosition,
    type,
    dropdownClassName,
    dropdownStyle,
    deleteTabItem,
    handleKeyDown,
    more,
    onVisibleTabsChange,
    visibleTabsStyle,
    arrowPosition,
    renderArrow,
    dropdownProps,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    ref,
    ...rest
}: TabBarProps) {
    const { locale } = useLocale('Tabs');
    const tabsContext = useTabsContext();

    const tabBarRef = useRef<HTMLDivElement>(null);
    const isFirstShowInViewport = useRef(true);
    const [shouldCollapse, setShouldCollapse] = useState(false);

    // Bar width at which the tabs overflowed. The collapsed layout can fit every tab at that width, but the uncollapsed
    // one cannot, so leaving the collapse below this width would flip-flop between the two.
    const collapsedWidth = useRef(0);
    let contents: ReactNode;

    // the library build does not go through React Compiler, so the merged ref is memoized by hand
    const mergedRef = useMergedRef(ref, tabBarRef);
    const effectiveCollapsible = collapsible === 'auto' ? shouldCollapse : collapsible || false;

    const tablistProps = {
        role: 'tablist',
        'aria-orientation': tabPosition === 'left' ? 'vertical' : 'horizontal',
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
    } as const;

    // Not collapsed yet. Once collapsed, the OverflowList visible-state callback decides whether to leave the collapse,
    // so this only ever turns it on.
    const checkOverflow = () => {
        const tabBarEl = tabBarRef.current;
        if (collapsible !== 'auto' || shouldCollapse || !tabBarEl) {
            return;
        }
        if (TabsFoundation.isTabsOverflowing(tabBarEl, tabPosition)) {
            collapsedWidth.current = tabBarEl.clientWidth;
            setShouldCollapse(true);
        }
    };

    const checkOverflowOnMount = useEffectEvent(checkOverflow);

    const scrollActiveTabItemIntoView = (logicalPosition?: ScrollLogicalPosition, behavior?: ScrollBehavior) => {
        TabsFoundation.scrollTabIntoView(tabBarRef.current, getBarItemKey(activeKey), logicalPosition, behavior);
    };

    const renderExtra = (): ReactNode => {
        if (!tabBarExtraContent) {
            return null;
        }
        // only float is taken from the element: its other style stays on the element and is not applied twice
        const extraFloat = isValidElement<{ style?: CSSProperties }>(tabBarExtraContent) ? tabBarExtraContent.props.style?.float : undefined;
        const extraCls = clsx(cssClasses.TABS_BAR_EXTRA, {
            [`${cssClasses.TABS_BAR}-${type}-extra`]: type,
            [`${cssClasses.TABS_BAR}-${type}-extra-${size}`]: size,
        });
        return (
            <div className={extraCls} style={{ float: extraFloat ?? 'inline-end' }} x-semi-prop="tabBarExtraContent">
                {tabBarExtraContent}
            </div>
        );
    };

    const renderTabItem = (panel: PlainTab): ReactElement => (
        <TabItem {...pick(panel, ['disabled', 'icon', 'itemKey', 'tab', 'closable'])} key={getBarItemKey(panel.itemKey)} type={type} deleteTabItem={deleteTabItem} selected={panel.itemKey === activeKey} size={size} tabPosition={tabPosition} handleKeyDown={handleKeyDown} onClick={onTabClick} />
    );

    // A tablist may own only tabs, so the arrows, the more trigger and the extra content stay outside it. The wrapper
    // is display: contents, leaving the tabs laid out as children of the bar.
    const renderTablist = (panels: PlainTab[]): ReactNode => (
        <div {...tablistProps} className={`${cssClasses.TABS_BAR}-tablist`}>
            {panels.map(renderTabItem)}
        </div>
    );

    // takes the item off `items`, so repeated clicks before the next render step on to the following hidden tab
    const handleArrowClick = (items: Array<OverflowItem>, pos: 'start' | 'end') => {
        const lastItem = pos === 'start' ? items.pop() : items.shift();
        if (lastItem) {
            TabsFoundation.scrollTabIntoView(tabBarRef.current, getBarItemKey(lastItem.itemKey));
        }
    };

    const renderCollapse = (items: Array<OverflowItem>, icon: ReactNode, pos: 'start' | 'end'): ReactNode => {
        const arrowCls = clsx(`${cssClasses.TABS_BAR}-arrow-${pos}`, `${cssClasses.TABS_BAR}-arrow`);
        const arrowName = pos === 'start' ? locale.prevTabs : locale.nextTabs;

        if (!items.length) {
            return (
                <div className={arrowCls} role="presentation">
                    <Button aria-label={arrowName} disabled theme="borderless" icon={icon} />
                </div>
            );
        }
        const menu = (
            <Dropdown.Menu>
                {items.map((panel) => (
                    <Dropdown.Item key={panel.itemKey} disabled={panel.disabled} active={panel.itemKey === activeKey} onClick={(e) => onTabClick(panel.itemKey, e)}>
                        {Boolean(panel.icon) && <span>{panel.icon}</span>}
                        {panel.tab}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        );

        const button = (
            // the Button is the Tab stop; Dropdown would add 0 here
            <div className={arrowCls} role="presentation" tabIndex={-1} onClick={() => handleArrowClick(items, pos)}>
                <Button aria-label={arrowName} theme="borderless" icon={icon} />
            </div>
        );

        if (!showRestInDropdown) {
            return button;
        }
        return (
            <Dropdown
                key={pos}
                style={dropdownStyle}
                clickToHide
                clickTriggerToHide
                disableFocusListener // prevent the panel from popping up again after clicking
                position={pos === 'start' ? 'bottomLeft' : 'bottomRight'}
                render={menu}
                showTick
                trigger="hover"
                {...dropdownProps?.[pos]}
                // the user's className adds to the built-in one: the built-in class supplies the popup's max-height and scrolling
                className={clsx(dropdownClassName, `${cssClasses.TABS_BAR}-dropdown`, dropdownProps?.[pos]?.className)}
            >
                {button}
            </Dropdown>
        );
    };

    const renderArrowSide = (items: Array<OverflowItem>, pos: 'start' | 'end'): ReactNode => {
        const icon = pos === 'start' ? <IconChevronLeft /> : <IconChevronRight />;
        const overflowNode = renderCollapse(items, icon, pos);
        if (renderArrow) {
            return renderArrow(items, pos, () => handleArrowClick(items, pos), overflowNode);
        }
        return overflowNode;
    };

    const renderOverflow = ([start, end]: [Array<OverflowItem>, Array<OverflowItem>]): [ReactNode, ReactNode] => [renderArrowSide(start, 'start'), renderArrowSide(end, 'end')];

    const handleVisibleStateChange = (visibleMap: Map<string, boolean>) => {
        const { visibleState, isShowInViewport, hasHidden } = TabsFoundation.readVisibleState(visibleMap);
        // only when the tabs component appears in the viewport for the first time triggered scrollActiveTabItemIntoView
        // refer to issue 2917 https://github.com/DouyinFE/semi-design/issues/2917
        if (isFirstShowInViewport.current && isShowInViewport) {
            scrollActiveTabItemIntoView('nearest', 'auto');
            isFirstShowInViewport.current = false;
        }
        // all false: the bar is off-screen, which must not change the collapse state
        if (collapsible === 'auto' && isShowInViewport) {
            const tabBarEl = tabBarRef.current;
            const stillTooNarrow = tabBarEl !== null && tabBarEl.clientWidth <= collapsedWidth.current;
            setShouldCollapse(hasHidden || stillTooNarrow);
        }
        onVisibleTabsChange?.(visibleState);
    };

    const renderCollapsedTab = (): ReactNode => {
        const renderedList = list.map((item) => ({
            key: getBarItemKey(item.itemKey),
            active: item.itemKey === activeKey,
            ...item,
        }));
        return (
            <OverflowList<OverflowItem>
                className={`${cssClasses.TABS_BAR}-overflow-list`}
                wrapperStyle={visibleTabsStyle}
                items={renderedList}
                overflowRenderDirection={arrowPosition}
                overflowRenderer={renderOverflow}
                visibleItemRenderer={renderTabItem}
                wrapperProps={tablistProps}
                renderMode="scroll"
                onVisibleStateChange={handleVisibleStateChange}
            />
        );
    };

    const renderMoreDropdown = (panels: PlainTab[], moreDropdownProps: DropdownProps, trigger: ReactNode) => (
        <Dropdown
            className={`${cssClasses.TABS_BAR}-more-dropdown-${type}`}
            clickToHide
            position="bottomLeft"
            render={
                <Dropdown.Menu>
                    {panels.map((panel) => (
                        <Dropdown.Item key={panel.itemKey} disabled={panel.disabled} active={activeKey === panel.itemKey} icon={panel.icon} onClick={(e) => onTabClick(panel.itemKey, e)}>
                            {panel.tab}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            }
            showTick
            trigger="hover"
            {...moreDropdownProps}
        >
            {trigger}
        </Dropdown>
    );

    const renderWithMoreTrigger = (): ReactNode => {
        let moreTrigger: ReactNode = (
            <button type="button" className={clsx(`${cssClasses.TABS_BAR}-more-trigger`, `${cssClasses.TABS_BAR}-more-trigger-${type}`)}>
                <span className={`${cssClasses.TABS_BAR}-more-trigger-content`}>
                    <span>{locale.more}</span>
                    <IconChevronDown className={`${cssClasses.TABS_BAR}-more-trigger-content-icon`} />
                </span>
            </button>
        );
        const { kept, moved } = TabsFoundation.splitMore(list, more);
        let moreDropdownProps: DropdownProps;
        if (typeof more === 'object') {
            moreDropdownProps = more.dropdownProps;
            if (more.render) {
                moreTrigger = more.render();
            }
        }
        // nothing moves into the menu, so there is no trigger either
        if (!moved.length) {
            return renderTablist(list);
        }

        return (
            <>
                <TabsContext value={{ ...tabsContext, tabbableKey: TabsFoundation.getTabbableKey(kept, activeKey) }}>{renderTablist(kept)}</TabsContext>
                {renderMoreDropdown(moved, moreDropdownProps, moreTrigger)}
                {/* A panel is labelled by its tab's id, and a tab in the menu is not rendered: this hidden copy of its
                    label takes the id, and aria-labelledby still reads hidden elements it points to */}
                {tabsContext.tabsId &&
                    moved.map((panel) => (
                        <span key={panel.itemKey} id={getTabId(tabsContext.tabsId, panel.itemKey)} hidden>
                            {panel.tab}
                        </span>
                    ))}
            </>
        );
    };

    // ResizeObserver reports after mount as well; this frame is the fallback when it does not fire
    useLayoutEffect(() => {
        const frame = requestAnimationFrame(() => checkOverflowOnMount());
        return () => cancelAnimationFrame(frame);
    }, []);

    useDidUpdate(activeKey, () => {
        if (effectiveCollapsible) {
            scrollActiveTabItemIntoView();
        }
    });

    useDidUpdate(
        list,
        () => {
            // tabs added, removed or retitled change how wide the bar must be, so the remembered width no longer applies
            collapsedWidth.current = 0;
            checkOverflow();
        },
        // a parent re-render hands over a new list of the same tabs; element titles are new objects each time and only count by key
        (a, b) => a.length === b.length && a.every((pane, i) => pane.itemKey === b[i].itemKey && (typeof pane.tab === 'object' || Object.is(pane.tab, b[i].tab)))
    );

    if (effectiveCollapsible) {
        contents = renderCollapsedTab();
    } else if (more) {
        contents = renderWithMoreTrigger();
    } else {
        contents = renderTablist(list);
    }

    const tabBarContent = (
        <div
            {...rest}
            ref={mergedRef}
            className={clsx(className, {
                [cssClasses.TABS_BAR]: true,
                [cssClasses.TABS_BAR_LINE]: type === 'line',
                [cssClasses.TABS_BAR_CARD]: type === 'card',
                [cssClasses.TABS_BAR_BUTTON]: type === 'button',
                [cssClasses.TABS_BAR_SLASH]: type === 'slash',
                [`${cssClasses.TABS_BAR}-${tabPosition}`]: tabPosition,
                [`${cssClasses.TABS_BAR}-collapse`]: effectiveCollapsible,
            })}
            style={style}
        >
            {contents}
            {renderExtra()}
        </div>
    );

    if (collapsible === 'auto') {
        return <ReactResizeObserver onResize={() => checkOverflow()}>{tabBarContent}</ReactResizeObserver>;
    }

    return tabBarContent;
}
