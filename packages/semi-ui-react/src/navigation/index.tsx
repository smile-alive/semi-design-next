import type React from 'react';
import { type ReactElement, type ReactNode, isValidElement, useLayoutEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { cssClasses, numbers } from '@fibrae/semi-foundation/navigation/constants';
import NavigationFoundation, { type NavigationAdapter, type NavigationState, type NavItemType } from '@fibrae/semi-foundation/navigation/foundation';
import '@fibrae/semi-foundation/navigation/navigation.scss';
import type { ElementProps } from '../_base/base';
import type { BaseProps } from '../_base/base-component';
import elementTypeOf from '../_base/element-type';
import flattenChildren from '../_base/flatten-children';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import useMergedRef from '../_base/use-merged-ref';
import type { DropdownProps } from '../dropdown';
import useLocale from '../locale/use-locale';
import Footer, { type NavFooterProps } from './footer';
import Header, { type NavHeaderProps } from './header';
import Item, { type NavItemProps, type ItemKey } from './item';
import { NavContext } from './nav-context';
import SubNav, { type SubNavProps } from './sub-nav';

export type { CollapseButtonProps } from './collapse-button';
export type { NavFooterProps } from './footer';
export type { NavHeaderProps } from './header';
export type { NavItemProps, ItemKey } from './item';
export type { SubNavProps } from './sub-nav';
export type Mode = 'vertical' | 'horizontal';

export interface OnSelectedData {
    itemKey: ItemKey;
    selectedKeys: (string | number)[];
    selectedItems: (NavItemProps | SubNavProps)[];
    domEvent: MouseEvent | KeyboardEvent;
}
export interface SubNavPropsWithItems extends SubNavProps {
    items?: (SubNavPropsWithItems | string)[];
}

export interface NavItemPropsWithItems extends NavItemProps {
    items?: (NavItemPropsWithItems | string)[];
}

export type NavItems = (string | SubNavPropsWithItems | NavItemPropsWithItems)[];

export interface NavProps extends BaseProps, ElementProps<'nav', 'onClick' | 'onSelect'> {
    bodyStyle?: React.CSSProperties;
    children?: React.ReactNode;

    defaultIsCollapsed?: boolean;
    defaultOpenKeys?: (string | number)[];
    defaultSelectedKeys?: (string | number)[];
    subDropdownProps?: DropdownProps;
    expandIcon?: React.ReactNode;
    footer?: React.ReactNode | NavFooterProps;
    header?: React.ReactNode | NavHeaderProps;
    isCollapsed?: boolean;
    items?: NavItems;
    limitIndent?: boolean;
    mode?: Mode;
    multiple?: boolean;
    openKeys?: (string | number)[];
    selectedKeys?: (string | number)[];
    subNavCloseDelay?: number;
    subNavMotion?: boolean;
    subNavOpenDelay?: number;
    toggleIconPosition?: 'left' | 'right';
    tooltipHideDelay?: number;
    tooltipShowDelay?: number;
    onClick?: (data: { itemKey?: ItemKey; text?: React.ReactNode; openKeys?: ItemKey[]; domEvent?: MouseEvent | KeyboardEvent; isOpen?: boolean }) => void;
    onCollapseChange?: (isCollapse: boolean) => void;
    onDeselect?: (data?: any) => void;
    onOpenChange?: (data: { itemKey?: ItemKey; openKeys?: ItemKey[]; domEvent?: MouseEvent | KeyboardEvent; isOpen?: boolean }) => void;
    onSelect?: (data: OnSelectedData) => void;
    renderWrapper?: ({ itemElement, isSubNav, isInSubNav, props }: { itemElement: ReactElement<any>; isInSubNav: boolean; isSubNav: boolean; props: NavItemProps | SubNavProps }) => ReactNode;
    /** Attached to the root nav */
    ref?: React.Ref<HTMLElement>;
}

const defaultProps = {
    subNavCloseDelay: numbers.DEFAULT_SUBNAV_CLOSE_DELAY,
    subNavOpenDelay: numbers.DEFAULT_SUBNAV_OPEN_DELAY,
    tooltipHideDelay: numbers.DEFAULT_TOOLTIP_HIDE_DELAY,
    tooltipShowDelay: numbers.DEFAULT_TOOLTIP_SHOW_DELAY,
    toggleIconPosition: 'right',
    limitIndent: true,
    subNavMotion: true,
    mode: 'vertical',
} satisfies Partial<NavProps>;

// items configs may carry app data (e.g. `path`), so only these keys, `data-*` and `aria-*` reach the item
const ITEM_CONFIG_KEYS = new Set<keyof NavItemProps>(['text', 'itemKey', 'icon', 'toggleIcon', 'indent', 'isCollapsed', 'isSubNav', 'link', 'linkOptions', 'disabled', 'className', 'style', 'forwardRef', 'level', 'tabIndex', 'tooltipHideDelay', 'tooltipShowDelay', 'onClick', 'onMouseEnter', 'onMouseLeave']);
const SUB_CONFIG_KEYS = new Set<keyof SubNavProps>(['text', 'itemKey', 'icon', 'indent', 'isCollapsed', 'isOpen', 'disabled', 'className', 'style', 'level', 'dropdownStyle', 'dropdownProps', 'subDropdownProps', 'expandIcon', 'onMouseEnter', 'onMouseLeave']);

function pickConfigProps(config: Record<string, any>, allowed: ReadonlySet<string>): Record<string, any> {
    return Object.fromEntries(Object.entries(config).filter(([key]) => allowed.has(key) || /^(data|aria)-/.test(key)));
}

function renderItems(items: (SubNavPropsWithItems | NavItemPropsWithItems)[], level: number, expandIcon: React.ReactNode, subDropdownProps: DropdownProps) {
    return (
        <>
            {items.map((item, idx) => {
                const { items: subItems } = item as SubNavPropsWithItems;
                // 0 and '' are valid keys
                const key = item.itemKey ?? String(level) + idx;
                if (Array.isArray(subItems) && subItems.length) {
                    return (
                        // the Nav-level values are defaults: a config's own expandIcon and subDropdownProps win
                        <SubNav key={key} expandIcon={expandIcon} subDropdownProps={subDropdownProps} {...pickConfigProps(item, SUB_CONFIG_KEYS)} level={level}>
                            {renderItems(subItems as (SubNavPropsWithItems | NavItemPropsWithItems)[], level + 1, expandIcon, subDropdownProps)}
                        </SubNav>
                    );
                }
                return <Item key={key} {...(pickConfigProps(item, ITEM_CONFIG_KEYS) as NavItemProps)} level={level} />;
            })}
        </>
    );
}

function isNodeContent(value: ReactNode | object): value is ReactNode {
    return typeof value !== 'object' || value === null || isValidElement(value) || Array.isArray(value);
}

/**
 * The itemKey tree read from the element tree, so a component that forwards itemKey to Nav.Item or Nav.Sub counts as
 * well. It cannot be collected by registration from the mounted items: a closed Sub does not mount its children, and
 * the first render needs the tree to open the ancestors of the selected item. The foundation drops an entry without
 * itemKey together with its subtree.
 */
function getItemsFromChildren(children: ReactNode): NavItemType[] {
    return flattenChildren(children).flatMap((child) => {
        if (!isValidElement<{ itemKey?: ItemKey; children?: ReactNode }>(child)) {
            return [];
        }
        return [{ itemKey: child.props.itemKey, items: getItemsFromChildren(child.props.children) }];
    });
}

function Nav(rawProps: NavProps) {
    const props = useDefaultProps('Nav', rawProps, defaultProps);

    const {
        ref,
        children: originChildren,
        mode,
        onOpenChange,
        onSelect,
        onClick,
        style,
        className,
        subNavCloseDelay,
        subNavOpenDelay,
        subNavMotion,
        tooltipShowDelay,
        tooltipHideDelay,
        bodyStyle,
        footer,
        header,
        toggleIconPosition,
        limitIndent,
        renderWrapper,
        defaultIsCollapsed,
        defaultOpenKeys,
        defaultSelectedKeys,
        subDropdownProps,
        expandIcon,
        isCollapsed: isCollapsedProp,
        items,
        multiple,
        openKeys: openKeysProp,
        selectedKeys: selectedKeysProp,
        onCollapseChange,
        onDeselect,
        ...rest
    } = props;

    const { locale } = useLocale('Navigation');

    const [collapseAnimating, setCollapseAnimating] = useState(false);

    const [foundation, state] = useFoundation<NavigationFoundation, NavigationAdapter<NavProps>, NavProps, NavigationState>(
        NavigationFoundation,
        props,
        () => NavigationFoundation.getInitialState(props, getItemsFromChildren(props.children)),
        (base) => ({
            getItemsFromChildren: () => getItemsFromChildren(base.getProps().children),
            setIsCollapsed: (isCollapsed) => base.setState({ isCollapsed }),
            notifyCollapseChange: (isCollapsed) => base.getProps().onCollapseChange?.(isCollapsed),
            updateSelectedKeys: (selectedKeys) => base.setState({ selectedKeys }),
            updateOpenKeys: (openKeys) => base.setState({ openKeys: [...openKeys] }),
        })
    );

    const isCollapsed = NavigationFoundation.getIsCollapsed(props, state);
    const openKeysIsControlled = NavigationFoundation.isOpenKeysControlled(props, isCollapsed);
    const openKeys = NavigationFoundation.getOpenKeys(props, state, isCollapsed);
    const { formattedItems, itemKeysMap } = useMemo(() => NavigationFoundation.getFormattedItems({ items }, getItemsFromChildren(originChildren)), [items, originChildren]);
    const selectedKeys = NavigationFoundation.getSelectedKeys(props, state, itemKeysMap);

    // texts remount on collapse, so they fade in only while the width animates (not for sub lists opened later)
    const [prevCollapsed, setPrevCollapsed] = useState(isCollapsed);

    // the merged props object is new on every render, so this runs after every update
    useDidUpdate(props, (_, prevProps) => foundation.handlePropsUpdate(prevProps));

    if (isCollapsed !== prevCollapsed) {
        setPrevCollapsed(isCollapsed);
        setCollapseAnimating(true);
    }

    // no transitionend comes when the width does not animate; getAnimations flushes style, so it lists this
    // commit's transition
    const navRef = useRef<HTMLElement>(null);

    const { onTransitionEnd } = rest as React.HTMLAttributes<HTMLElement>;
    const setNavRef = useMergedRef(ref, navRef);
    const footers: React.ReactNode[] = [];
    const headers: React.ReactNode[] = [];

    const handleTransitionEnd = (event: React.TransitionEvent<HTMLElement>) => {
        onTransitionEnd?.(event);
        if (event.target === event.currentTarget && event.propertyName === 'width') {
            setCollapseAnimating(false);
        }
    };

    useLayoutEffect(() => {
        if (!collapseAnimating) {
            return;
        }
        const animatesWidth = navRef.current.getAnimations().some((animation) => animation instanceof CSSTransition && animation.transitionProperty === 'width');
        if (!animatesWidth) {
            setCollapseAnimating(false);
        }
    }, [collapseAnimating]);

    if (!isNodeContent(footer)) {
        footers.push(<Footer key={0} {...footer} />);
    } else if (footer) {
        footers.push(<Footer key={0}>{footer}</Footer>);
    }

    if (!isNodeContent(header)) {
        headers.push(<Header key={0} {...header} />);
    } else if (header) {
        headers.push(<Header key={0}>{header}</Header>);
    }

    const children: React.ReactNode[] = [];

    flattenChildren(originChildren).forEach((child, index) => {
        const type = elementTypeOf(child);
        if (type === 'Nav.Footer') {
            footers.push(child);
        } else if (type === 'Nav.Header') {
            headers.push(child);
        } else if (isValidElement<{ itemKey?: ItemKey }>(child) && (child.type === Item || child.type === SubNav || child.type === 'li' || child.props.itemKey != null)) {
            // an element with itemKey is a navigation item that renders its own li, wrapped or not
            children.push(child);
        } else {
            // a ul may hold only li; this li has no box
            children.push(
                <li key={isValidElement(child) ? child.key : index} className={`${cssClasses.PREFIX}-list-extra`}>
                    {child}
                </li>
            );
        }
    });

    const finalCls = clsx(cssClasses.PREFIX, className, {
        [`${cssClasses.PREFIX}-collapsed`]: isCollapsed,
        [`${cssClasses.PREFIX}-collapse-animating`]: collapseAnimating,
        [`${cssClasses.PREFIX}-horizontal`]: mode === 'horizontal',
        [`${cssClasses.PREFIX}-vertical`]: mode === 'vertical',
    });

    const headerListOuterCls = clsx(`${cssClasses.PREFIX}-header-list-outer`, {
        [`${cssClasses.PREFIX}-header-list-outer-collapsed`]: isCollapsed,
    });

    const selectedKeysIsControlled = props.selectedKeys !== undefined;

    // stable while its inputs hold, so memoized consumers (NavHeader, NavFooter) skip renders that change none of them
    const contextValue = useMemo(
        () => ({
            subNavCloseDelay,
            subNavOpenDelay,
            subNavMotion,
            tooltipShowDelay,
            tooltipHideDelay,
            openKeys,
            openKeysIsControlled,
            selectedKeys,
            selectedKeysIsControlled,
            isCollapsed,
            isInSubNav: false,
            toggleCollapsed: foundation.handleCollapseChange,
            mode,
            onSelect,
            onOpenChange,
            updateSelectedKeys: foundation.updateSelectedKeys,
            addOpenKey: foundation.addOpenKey,
            removeOpenKey: foundation.removeOpenKey,
            onClick,
            locale,
            toggleIconPosition,
            limitIndent,
            renderWrapper,
        }),
        [subNavCloseDelay, subNavOpenDelay, subNavMotion, tooltipShowDelay, tooltipHideDelay, openKeys, openKeysIsControlled, selectedKeys, selectedKeysIsControlled, isCollapsed, foundation, mode, onSelect, onOpenChange, onClick, locale, toggleIconPosition, limitIndent, renderWrapper]
    );

    return (
        <NavContext value={contextValue}>
            {/* APG disclosure navigation: a landmark holding lists of links and buttons */}
            <nav {...rest} ref={setNavRef} className={finalCls} style={style} onTransitionEnd={handleTransitionEnd}>
                <div className={`${cssClasses.PREFIX}-inner`}>
                    <div className={headerListOuterCls}>
                        {headers}
                        <div className={`${cssClasses.PREFIX}-list-wrapper`} style={bodyStyle}>
                            <ul className={`${cssClasses.PREFIX}-list`}>
                                {renderItems(formattedItems, 0, expandIcon, subDropdownProps)}
                                {children}
                            </ul>
                        </div>
                    </div>
                    {footers}
                </div>
            </nav>
        </NavContext>
    );
}

export default Object.assign(Nav, { Sub: SubNav, Item, Header, Footer });
