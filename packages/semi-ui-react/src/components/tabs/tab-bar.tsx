import { type CSSProperties, type ReactElement, type ReactNode, isValidElement, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses, getBarItemKey } from '@fibrae/semi-foundation/components/tabs/constants';
import TabsFoundation from '@fibrae/semi-foundation/components/tabs/foundation';
import TabBarFoundation, { type TabBarAdapter, type TabBarState } from '@fibrae/semi-foundation/components/tabs/tab-bar-foundation';
import { IconChevronRight, IconChevronLeft, IconChevronDown } from '@fibrae/semi-icons-react';
import { useFoundation } from '../../base/index';
import { useMergedRef, useUnwrappedLazy } from '../../hooks/index';
import ReactResizeObserver from '../../internal/resize-observer';
import Button from '../button';
import Dropdown, { type DropdownProps } from '../dropdown';
import useLocale from '../locale/use-locale';
import OverflowList, { type OverflowListInternalProps } from '../overflow-list';
import { TabsContext, useTabsContext } from './context';
import { getTabId } from './ids';
import type { TabBarProps, PlainTab } from './interface';
import TabItem from './tab-item';

export interface OverflowItem extends PlainTab {
    key: string;
    active: boolean;
}

const InternalOverflowList = OverflowList as (props: OverflowListInternalProps<OverflowItem>) => ReactElement;

export default function TabBar(props: TabBarProps) {
    const {
        activeKey,
        className,
        classNames,
        collapsible,
        list,
        onTabClick,
        showRestInDropdown,
        size,
        style,
        styles,
        tabBarExtraContent: rawTabBarExtraContent,
        tabPosition,
        type,
        dropdownClassName,
        dropdownStyle,
        deleteTabItem,
        handleKeyDown,
        more,
        onVisibleTabsChange: _onVisibleTabsChange,
        arrowPosition,
        renderArrow,
        dropdownProps,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
        ref,
        ...rest
    } = props;

    const { locale } = useLocale('Tabs');
    const tabsContext = useTabsContext();
    const tabBarExtraContent = useUnwrappedLazy(rawTabBarExtraContent);

    const tabBarRef = useRef<HTMLDivElement>(null);
    let contents: ReactNode;

    const [foundation, state] = useFoundation<TabBarFoundation<TabBarProps>, TabBarAdapter<TabBarProps>, TabBarProps, TabBarState>(TabBarFoundation, props, TabBarFoundation.getInitialState, (base) => ({
        getBarElement: () => tabBarRef.current,
        notifyVisibleTabsChange: (visibleState) => base.getProps().onVisibleTabsChange?.(visibleState),
    }));

    // the library build does not go through React Compiler, so the merged ref is memoized by hand
    const mergedRef = useMergedRef(ref, tabBarRef);
    const effectiveCollapsible = TabBarFoundation.isCollapsed(collapsible, state.shouldCollapse);

    const tablistProps = {
        role: 'tablist',
        'aria-orientation': tabPosition === 'left' ? 'vertical' : 'horizontal',
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
    } as const;

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
        <TabItem
            key={getBarItemKey(panel.itemKey)}
            type={type}
            disabled={panel.disabled}
            closable={panel.closable}
            deleteTabItem={deleteTabItem}
            itemKey={panel.itemKey}
            selected={panel.itemKey === activeKey}
            size={size}
            tab={panel.tab}
            tabPosition={tabPosition}
            icon={panel.icon}
            handleKeyDown={handleKeyDown}
            onClick={onTabClick}
        />
    );

    // A tablist may own only tabs, so the arrows, the more trigger and the extra content stay outside it. The wrapper
    // is display: contents, leaving the tabs laid out as children of the bar.
    const renderTablist = (panels: PlainTab[]): ReactNode => (
        <div {...tablistProps} className={`${cssClasses.TABS_BAR}-tablist`}>
            {panels.map(renderTabItem)}
        </div>
    );

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
            <div className={arrowCls} role="presentation" tabIndex={-1} onClick={() => foundation.handleArrowClick(items, pos)}>
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
            return renderArrow(items, pos, () => foundation.handleArrowClick(items, pos), overflowNode);
        }
        return overflowNode;
    };

    const renderOverflow = ([start, end]: [Array<OverflowItem>, Array<OverflowItem>]): [ReactNode, ReactNode] => [renderArrowSide(start, 'start'), renderArrowSide(end, 'end')];

    const renderCollapsedTab = (): ReactNode => {
        const renderedList = list.map((item) => ({
            key: getBarItemKey(item.itemKey),
            active: item.itemKey === activeKey,
            ...item,
        }));
        return (
            <InternalOverflowList
                className={`${cssClasses.TABS_BAR}-overflow-list`}
                classNames={{ wrapper: classNames?.visibleTabs }}
                styles={{ wrapper: styles?.visibleTabs }}
                items={renderedList}
                overflowRenderDirection={arrowPosition}
                overflowRenderer={renderOverflow}
                visibleItemRenderer={renderTabItem}
                wrapperProps={tablistProps}
                renderMode="scroll"
                onVisibleStateChange={foundation.handleVisibleStateChange}
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
        return <ReactResizeObserver onResize={foundation.checkOverflow}>{tabBarContent}</ReactResizeObserver>;
    }

    return tabBarContent;
}
