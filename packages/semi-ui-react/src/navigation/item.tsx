import type React from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/navigation/constants';
import ItemFoundation, { type ItemAdapter, type ItemProps, type ItemKey, type SelectedItemProps, countPlaceholderIcons } from '@fibrae/semi-foundation/navigation/item-foundation';
import type { ElementProps } from '../_base/base';
import type { BaseProps } from '../_base/base-component';
import useFoundation from '../_base/use-foundation';
import useMergedRef from '../_base/use-merged-ref';
import { cloneDeep } from '../_utils';
import Dropdown from '../dropdown';
import Tooltip from '../tooltip';
import { useNavContext } from './nav-context';
import { fitNavIcon } from './nav-icon';
import type { SubNavProps } from './sub-nav';

const clsPrefix = `${cssClasses.PREFIX}-item`;
export interface NavItemProps extends ItemProps, Omit<BaseProps, 'children'>, ElementProps<'li', 'onClick' | 'children'> {
    disabled?: boolean;
    forwardRef?: (ele: HTMLLIElement) => void;
    icon?: React.ReactNode;
    itemKey?: ItemKey;
    level?: number;
    link?: string;
    linkOptions?: React.AnchorHTMLAttributes<HTMLAnchorElement>;
    tabIndex?: number;
    text?: React.ReactNode;
    toggleIcon?: React.ReactNode;
    tooltipHideDelay?: number;
    tooltipShowDelay?: number;

    onClick?(clickItems: SelectedData): void;

    onMouseEnter?: React.MouseEventHandler<HTMLLIElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLLIElement>;
    /** Attached to the li; inside a collapsed or horizontal popup, to the Dropdown.Item li */
    ref?: React.Ref<HTMLLIElement>;
}

export interface SelectedData extends SelectedItemProps<NavItemProps> {
    text?: React.ReactNode;
}

export type { ItemKey } from '@fibrae/semi-foundation/navigation/item-foundation';

/** What only SubNav passes: it renders its own title and list inside the wrapper li that Item builds */
interface NavItemShellProps extends NavItemProps {
    /** Replaces the icons and text of the item */
    itemContent?: React.ReactNode;
    /** What `renderWrapper` receives as props; the SubNav's own props */
    wrapperProps?: NavItemProps | SubNavProps;
}

export function NavItemShell({ ref, itemContent, wrapperProps, ...props }: NavItemShellProps): React.ReactNode {
    const { text, icon, toggleIcon, className, isSubNav = false, style, indent = false, onMouseEnter, onMouseLeave, link, linkOptions, disabled = false, level = 0, tabIndex, itemKey, isCollapsed: isCollapsedProp, forwardRef, onClick, tooltipHideDelay, tooltipShowDelay, ...rest } = props;

    const context = useNavContext();

    let itemChildren: React.ReactNode = null;

    // ref stays out of the props the foundation reads: onSelect reports a deep clone of them as selectedItems
    const [foundation] = useFoundation<ItemFoundation, ItemAdapter<NavItemProps>, NavItemProps, object>(
        ItemFoundation,
        props,
        () => ({}),
        (base) => ({
            cloneDeep,
            selectSelf: () => base.getContexts().updateSelectedKeys?.([base.getProp('itemKey')]),
            getSelectedKeysIsControlled: () => base.getContexts().selectedKeysIsControlled,
            notifyGlobalOnSelect: (data) => base.getContexts().onSelect?.(data),
            notifyGlobalOnClick: (data) => base.getContexts().onClick?.(data),
            notifyClick: (data) => base.getProps().onClick?.(data),
            getSelected: () => Boolean(base.getContexts().selectedKeys?.includes(base.getProp('itemKey'))),
        }),
        context
    );

    const { mode, isInSubNav, limitIndent, toggleIconPosition, renderWrapper } = context;
    const isCollapsed = isCollapsedProp || Boolean(context.isCollapsed);
    const selected = Boolean(context.selectedKeys?.includes(itemKey));
    const setItemRef = useMergedRef(forwardRef, ref);
    const isPopupItem = Boolean(isInSubNav) && (isCollapsed || mode === strings.MODE_HORIZONTAL);

    const handleClick = (e: React.MouseEvent) => foundation.handleClick(e.nativeEvent);

    const renderIcon = (iconNode: React.ReactNode, pos: string, isToggleIcon: boolean, key: number | string) => {
        if (isSubNav) {
            return null;
        }

        if (!iconNode && mode === strings.MODE_HORIZONTAL) {
            return null;
        }

        const iconSize = pos === strings.ICON_POS_RIGHT ? 'default' : 'large';

        const iconCls = clsx(`${clsPrefix}-icon`, {
            [`${clsPrefix}-icon-toggle-${toggleIconPosition}`]: isToggleIcon,
            [`${clsPrefix}-icon-info`]: !isToggleIcon,
        });

        return (
            <i key={key} className={iconCls}>
                {fitNavIcon(iconNode, iconSize)}
            </i>
        );
    };

    if (itemContent != null) {
        itemChildren = itemContent;
    } else {
        const placeholderIcons = Array.from({ length: countPlaceholderIcons({ mode, limitIndent, isCollapsed, hasIcon: Boolean(icon), indent, level }) }, (_, index) => renderIcon(null, strings.ICON_POS_RIGHT, false, index));
        itemChildren = (
            <>
                {placeholderIcons}
                {toggleIconPosition === strings.TOGGLE_ICON_LEFT && renderIcon(toggleIcon, strings.ICON_POS_RIGHT, true, 'key-toggle-pos-right')}
                {Boolean(icon || indent || isInSubNav) && renderIcon(icon, strings.ICON_POS_LEFT, false, 'key-position-left')}
                {text != null ? <span className={`${cssClasses.PREFIX}-item-text`}>{text}</span> : ''}
                {toggleIconPosition === strings.TOGGLE_ICON_RIGHT && renderIcon(toggleIcon, strings.ICON_POS_RIGHT, true, 'key-toggle-pos-right')}
            </>
        );
    }

    let itemDom: React.ReactElement<any>;

    const hasLink = typeof link === 'string';

    if (isPopupItem) {
        const popoverItemCls = clsx({
            [clsPrefix]: true,
            [`${clsPrefix}-sub`]: isSubNav,
            [`${clsPrefix}-selected`]: selected,
            [`${clsPrefix}-collapsed`]: isCollapsed,
            [`${clsPrefix}-disabled`]: disabled,
        });

        // Dropdown activates the li on Enter and Space; clicking the link instead applies its target and rel, and
        // the bubbled click is reported once
        const handlePopupClick = (e: React.MouseEvent<HTMLLIElement>) => {
            const popupLink = e.target === e.currentTarget && hasLink ? e.currentTarget.querySelector('a') : null;
            if (popupLink) {
                popupLink.click();
                return;
            }
            handleClick(e);
        };

        itemDom = (
            <Dropdown.Item {...rest} ref={ref} className={clsx(className, popoverItemCls)} style={style} aria-current={selected && !isSubNav ? 'page' : undefined} disabled={disabled} active={selected} forwardRef={forwardRef} onClick={handlePopupClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                {/* the li is the menuitem, so the link inside is not a focus target of its own */}
                {hasLink ? (
                    <a tabIndex={-1} href={link} {...linkOptions} className={clsx(`${cssClasses.PREFIX}-item-link`, linkOptions?.className)}>
                        {itemChildren}
                    </a>
                ) : (
                    itemChildren
                )}
            </Dropdown.Item>
        );
    } else {
        const itemCls = clsx(`${className || `${clsPrefix}-normal`}`, {
            [clsPrefix]: true,
            [`${clsPrefix}-sub`]: isSubNav,
            [`${clsPrefix}-selected`]: selected && !isSubNav,
            [`${clsPrefix}-collapsed`]: isCollapsed,
            [`${clsPrefix}-disabled`]: disabled,
            [`${clsPrefix}-has-link`]: hasLink && !isSubNav,
            [`${clsPrefix}-has-button`]: !hasLink && !isSubNav,
        });
        // aria-* goes to the link or button that takes focus
        const ariaProps: Record<string, any> = {};
        const liProps: Record<string, any> = {};
        for (const [key, value] of Object.entries(rest)) {
            (key.startsWith('aria-') ? ariaProps : liProps)[key] = value;
        }

        let content: React.ReactNode = itemChildren;
        if (!isSubNav) {
            const controlProps = {
                ...ariaProps,
                tabIndex,
                'aria-current': selected ? ('page' as const) : undefined,
                'aria-disabled': disabled || undefined,
            };
            // a disabled item stays focusable so that it can be found; the foundation ignores its activation
            content = hasLink ? (
                <a
                    href={link}
                    {...linkOptions}
                    {...controlProps}
                    className={clsx(`${cssClasses.PREFIX}-item-link`, linkOptions?.className)}
                    onClick={(e) => {
                        linkOptions?.onClick?.(e);
                        handleClick(e);
                    }}
                >
                    {itemChildren}
                </a>
            ) : (
                <button type="button" className={`${cssClasses.PREFIX}-item-button`} {...controlProps} onClick={handleClick}>
                    {itemChildren}
                </button>
            );
            if (!isInSubNav && mode !== strings.MODE_HORIZONTAL) {
                // present in both states, only active when collapsed: swapping the wrapper would remount the focused control
                content = (
                    <Tooltip condition={isCollapsed} content={text} mouseEnterDelay={tooltipShowDelay ?? context.tooltipShowDelay} mouseLeaveDelay={tooltipHideDelay ?? context.tooltipHideDelay} position="right" trigger="hover" wrapWhenSpecial={false}>
                        {content}
                    </Tooltip>
                );
            }
        }

        itemDom = (
            <li {...liProps} ref={setItemRef} className={itemCls} style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                {content}
            </li>
        );
    }

    if (typeof renderWrapper === 'function') {
        return renderWrapper({ itemElement: itemDom, isSubNav, isInSubNav, props: wrapperProps ?? props });
    }

    return itemDom;
}

export default function NavItem(props: NavItemProps): React.ReactNode {
    return <NavItemShell {...props} />;
}
