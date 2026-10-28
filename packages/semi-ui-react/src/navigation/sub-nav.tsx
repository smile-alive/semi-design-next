import type React from 'react';
import { isValidElement, useId, useRef } from 'react';
import clsx from 'clsx';
import { strings, cssClasses } from '@fibrae/semi-foundation/navigation/constants';
import { countPlaceholderIcons } from '@fibrae/semi-foundation/navigation/item-foundation';
import SubNavFoundation, { type SubNavAdapter } from '@fibrae/semi-foundation/navigation/sub-nav-foundation';
import '@fibrae/semi-foundation/navigation/navigation.scss';
import { IconChevronDown, IconChevronRight } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../_base/base';
import type { BaseProps } from '../_base/base-component';
import useFocusHandover from '../_base/use-focus-handover';
import useFoundation from '../_base/use-foundation';
import useMergedRef from '../_base/use-merged-ref';
import CSSAnimation from '../_css-animation';
import Collapsible from '../collapsible';
import Dropdown, { type DropdownProps } from '../dropdown';
import Tooltip from '../tooltip';
import { NavItemShell } from './item';
import { NavContext, useNavContext } from './nav-context';
import { fitNavIcon } from './nav-icon';

export interface SubNavProps extends BaseProps, ElementProps<'li', 'onClick'> {
    disabled?: boolean;
    dropdownStyle?: React.CSSProperties;
    icon?: React.ReactNode;
    indent?: boolean | number;
    isCollapsed?: boolean;
    isOpen?: boolean;
    itemKey?: string | number;
    level?: number;
    maxHeight?: number;
    onMouseEnter?: React.MouseEventHandler<HTMLLIElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLLIElement>;
    text?: React.ReactNode;
    expandIcon?: React.ReactNode;
    dropdownProps?: DropdownProps;
    subDropdownProps?: DropdownProps;
    /** Attached to the wrapper li */
    ref?: React.Ref<HTMLLIElement>;
}

export default function SubNav({ ref, ...props }: SubNavProps) {
    const { text, icon, itemKey, indent = false, disabled = false, level = 0, expandIcon, style, className, onMouseEnter, onMouseLeave, children, dropdownStyle, dropdownProps: userDropdownProps, subDropdownProps, isCollapsed: isCollapsedProp, isOpen: isOpenProp, maxHeight, ...restProps } = props;

    const context = useNavContext();

    const itemRef = useRef<HTMLLIElement>(null);

    const [foundation] = useFoundation<SubNavFoundation, SubNavAdapter<SubNavProps>, SubNavProps, object>(
        SubNavFoundation,
        props,
        () => ({}),
        (base) => ({
            getOpenKeys: () => base.getContexts().openKeys,
            getOpenKeysIsControlled: () => base.getContexts().openKeysIsControlled,
            updateOpen: (isOpen) => {
                const { addOpenKey, removeOpenKey } = base.getContexts();
                (isOpen ? addOpenKey : removeOpenKey)?.(base.getProp('itemKey'));
            },
            notifyGlobalOpenChange: (data) => base.getContexts().onOpenChange?.(data),
            notifyGlobalOnClick: (data) => base.getContexts().onClick?.(data),
            getIsOpen: () => Boolean(base.getContexts().openKeys?.includes(base.getProp('itemKey'))),
        }),
        context
    );

    const subListId = useId();

    // Collapsing or expanding the nav swaps the title's wrapper (inline disclosure button <-> popup trigger), which remounts
    // it; focus follows to the new title
    const handoverFocus = useFocusHandover<HTMLElement>(() => itemRef.current?.querySelector<HTMLElement>(`.${cssClasses.PREFIX}-sub-title`));

    const setItemRef = useMergedRef(ref, itemRef);

    // aria-* goes to the title, which takes focus
    const ariaProps: Record<string, any> = {};
    const rest: Record<string, any> = {};

    for (const [key, value] of Object.entries(restProps)) {
        (key.startsWith('aria-') ? ariaProps : rest)[key] = value;
    }

    let withTransition = false;
    let toggleIconType: React.ReactNode = '';

    const { mode, isInSubNav, isCollapsed, subNavMotion, limitIndent, toggleIconPosition, subNavCloseDelay, subNavOpenDelay } = context;
    const isOpen = Boolean(context.openKeys?.includes(itemKey));
    const isSelected = itemKey != null && (context.selectedKeys ?? []).includes(itemKey);
    const isHorizontal = mode === strings.MODE_HORIZONTAL;

    const renderIcon = (iconNode: React.ReactNode, pos: string, withTransition: boolean, isToggleIcon: boolean, key: number | string) => {
        const iconSize = pos === strings.ICON_POS_RIGHT ? 'default' : 'large';

        const iconCls = clsx(`${cssClasses.PREFIX}-item-icon`, {
            [`${cssClasses.PREFIX}-item-icon-toggle-${toggleIconPosition}`]: isToggleIcon,
            [`${cssClasses.PREFIX}-item-icon-info`]: !isToggleIcon,
        });

        return (
            <i key={key} className={iconCls}>
                {withTransition && isValidElement(iconNode) ? (
                    <CSSAnimation startClassName={`${cssClasses.PREFIX}-icon-rotate-${isOpen ? '180' : '0'}`} animationState={isOpen ? 'enter' : 'leave'}>
                        {({ animationClassName }) => fitNavIcon(iconNode, iconSize, animationClassName)}
                    </CSSAnimation>
                ) : (
                    fitNavIcon(iconNode, iconSize)
                )}
            </i>
        );
    };

    if (isCollapsed) {
        toggleIconType = isInSubNav ? <IconChevronRight /> : null;
    } else if (isHorizontal) {
        if (isInSubNav) {
            toggleIconType = <IconChevronRight />;
        } else {
            toggleIconType = expandIcon ? expandIcon : <IconChevronDown />;
            // no transition in horizontal mode: the list is a dropdown (issue 1198)
        }
    } else {
        withTransition = Boolean(subNavMotion);
        toggleIconType = expandIcon ? expandIcon : <IconChevronDown />;
    }

    let titleDiv: React.ReactNode;

    const placeholderIcons = Array.from({ length: countPlaceholderIcons({ mode, limitIndent, isCollapsed, hasIcon: Boolean(icon), indent, level }) }, (_, index) => renderIcon(null, strings.ICON_POS_RIGHT, false, false, index));
    const isPopup = Boolean(isCollapsed) || isHorizontal;

    const titleCls = clsx(`${cssClasses.PREFIX}-sub-title`, {
        [`${cssClasses.PREFIX}-sub-title-selected`]: isSelected,
        [`${cssClasses.PREFIX}-sub-title-disabled`]: disabled,
    });

    // a span: a button takes phrasing content only
    const titleInner = (
        <span className={`${cssClasses.PREFIX}-item-inner`}>
            {placeholderIcons}
            {toggleIconPosition === strings.TOGGLE_ICON_LEFT && renderIcon(toggleIconType, strings.ICON_POS_RIGHT, withTransition, true, 'key-toggle-position-left')}
            {Boolean(icon || indent || (isInSubNav && !isHorizontal)) && renderIcon(icon, strings.ICON_POS_LEFT, false, false, 'key-inSubNav-position-left')}
            <span className={`${cssClasses.PREFIX}-item-text`}>{text}</span>
            {toggleIconPosition === strings.TOGGLE_ICON_RIGHT && renderIcon(toggleIconType, strings.ICON_POS_RIGHT, withTransition, true, 'key-toggle-position-right')}
        </span>
    );

    const handleTitleClick = (e: React.MouseEvent) => (isPopup ? foundation.handlePopupClick(e.nativeEvent) : foundation.handleClick(e.nativeEvent));

    if (isPopup && isInSubNav) {
        // Dropdown adds aria-haspopup and aria-expanded to the menuitem and moves focus with the arrow keys
        titleDiv = (
            <div {...ariaProps} ref={handoverFocus} className={titleCls} aria-disabled={disabled} role="menuitem" tabIndex={-1} onClick={handleTitleClick}>
                {titleInner}
            </div>
        );
    } else {
        // APG disclosure navigation; a popup title gets aria-haspopup and aria-expanded from Dropdown
        titleDiv = (
            // the list is unmounted while closed, so an id reference to it only exists when it is open
            <button {...ariaProps} ref={handoverFocus} type="button" className={titleCls} aria-controls={!isPopup && isOpen ? subListId : undefined} aria-disabled={disabled || undefined} aria-expanded={isPopup ? undefined : isOpen} onClick={handleTitleClick}>
                {titleInner}
            </button>
        );
    }

    let subList: React.ReactNode = null;

    const subUl = (
        <ul
            id={subListId}
            className={clsx(`${cssClasses.PREFIX}-sub`, {
                [`${cssClasses.PREFIX}-sub-open`]: isOpen,
                [`${cssClasses.PREFIX}-sub-popover`]: isPopup,
            })}
        >
            {children}
        </ul>
    );

    if (!isHorizontal) {
        if (subNavMotion) {
            subList = (
                <Collapsible fade isOpen={isOpen} keepDOM={false} motion={subNavMotion}>
                    {!isCollapsed && subUl}
                </Collapsible>
            );
        } else if (isOpen && !isCollapsed) {
            subList = subUl;
        }
    }

    // a disabled sub opens no Dropdown; collapsed, its hidden text shows in a tooltip instead
    if (isCollapsed && disabled) {
        titleDiv = (
            <Tooltip content={text} mouseEnterDelay={context.tooltipShowDelay} mouseLeaveDelay={context.tooltipHideDelay} position="right" trigger="hover" wrapWhenSpecial={false}>
                {titleDiv}
            </Tooltip>
        );
    } else if (isPopup && !disabled) {
        // defaults first so the user's dropdownProps win; only what Nav controls is written after them
        const dropdownProps: DropdownProps = { trigger: 'hover', ...(userDropdownProps ?? subDropdownProps) };
        if (dropdownStyle) {
            dropdownProps.style = dropdownStyle;
        }
        titleDiv = (
            <Dropdown
                mouseEnterDelay={subNavOpenDelay}
                mouseLeaveDelay={subNavCloseDelay}
                position={isHorizontal && !isInSubNav ? 'bottomLeft' : 'rightTop'}
                render={<Dropdown.Menu>{children}</Dropdown.Menu>}
                {...dropdownProps}
                // the user's className adds to the built-in popover class, which carries the collapsed popup's styling
                className={clsx({ [`${cssClasses.PREFIX}-popover`]: isCollapsed }, dropdownProps.className)}
                onVisibleChange={(visible) => {
                    foundation.handleDropdownVisibleChange(visible);
                    dropdownProps.onVisibleChange?.(visible);
                }}
            >
                {titleDiv}
            </Dropdown>
        );
    }

    return (
        <NavItemShell
            {...rest}
            ref={setItemRef}
            className={`${cssClasses.PREFIX}-sub-wrap`}
            style={style}
            disabled={disabled}
            isCollapsed={isCollapsed}
            isSubNav
            itemContent={
                <NavContext value={{ ...context, isInSubNav: true }}>
                    {titleDiv}
                    {subList}
                </NavContext>
            }
            itemKey={itemKey}
            text={text}
            wrapperProps={props}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        />
    );
}
