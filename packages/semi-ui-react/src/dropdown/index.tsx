import type React from 'react';
import { cloneElement, isValidElement, useImperativeHandle, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses, strings, numbers } from '@fibrae/semi-foundation/dropdown/constants';
import DropdownFoundation, { type DropdownAdapter } from '@fibrae/semi-foundation/dropdown/foundation';
import type { DropdownSelectionMode } from '@fibrae/semi-foundation/dropdown/menu-foundation';
import { noop } from '@fibrae/semi-foundation/utils/function';
import '@fibrae/semi-foundation/dropdown/dropdown.scss';
import elementTypeOf from '../_base/element-type';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import { useConfigContext } from '../config-provider/context';
import Tooltip, { type Position, type RenderContentProps, type TooltipHandle, type TooltipProps, type Trigger, canCarryPopupState, wrapSpan } from '../tooltip/index';
import { DropdownContext, useDropdownContext } from './context';
import DropdownDivider, { type DropdownDividerProps } from './dropdown-divider';
import DropdownItem, { type DropdownItemProps } from './dropdown-item';
import DropdownMenu from './dropdown-menu';
import DropdownTitle, { type DropdownTitleProps } from './dropdown-title';

export type { DropdownDividerProps } from './dropdown-divider';
export type { DropdownItemProps, Type } from './dropdown-item';
export type { DropdownMenuProps } from './dropdown-menu';
export type { DropdownTitleProps } from './dropdown-title';

export interface DropDownMenuItemItem extends Omit<DropdownItemProps, 'children'> {
    node: 'item';
    name?: string;
}
export interface DropDownMenuItemDivider extends DropdownDividerProps {
    node: 'divider';
}
export interface DropDownMenuItemTitle extends Omit<DropdownTitleProps, 'children'> {
    node: 'title';
    name?: string;
}

export type DropDownMenuItem = DropDownMenuItemItem | DropDownMenuItemDivider | DropDownMenuItemTitle;

export interface DropdownProps extends TooltipProps {
    render?: React.ReactNode;
    children?: React.ReactNode;
    visible?: boolean;
    position?: Position;
    mouseEnterDelay?: number;
    mouseLeaveDelay?: number;
    menu?: DropDownMenuItem[];
    trigger?: Trigger;
    motion?: boolean;
    className?: string;
    contentClassName?: string | any[];
    style?: React.CSSProperties;
    onVisibleChange?: (visible: boolean) => void;
    /**
     * How the items are selected (a submenu uses its own Dropdown's value); `active` marks selected items:
     * - 'single': role="menuitemradio" with aria-checked;
     * - 'multiple': role="menuitemcheckbox" with aria-checked;
     * - unset: menuitemcheckbox with aria-checked when showTick is on, otherwise menuitem without aria-checked.
     */
    selectionMode?: DropdownSelectionMode;
    showTick?: boolean;
    closeOnEsc?: TooltipProps['closeOnEsc'];
    onEscKeyDown?: TooltipProps['onEscKeyDown'];
}

interface DropdownState {
    popVisible: boolean;
}

const defaultProps = {
    onVisibleChange: noop,
    prefixCls: cssClasses.PREFIX,
    motion: true,
    trigger: 'hover',
    position: 'bottom',
    mouseLeaveDelay: strings.DEFAULT_LEAVE_DELAY,
    showTick: false,
    closeOnEsc: true,
    onEscKeyDown: noop,
} satisfies Partial<DropdownProps>;

/** Whether the trigger can carry the menu button attributes; a Dropdown.Item with a submenu is a menuitem */
function isMenuButton(child: React.ReactElement<Record<string, any>>) {
    return elementTypeOf(child) === 'Dropdown.Item' || canCarryPopupState(child);
}

function renderMenu(menu: DropDownMenuItem[]) {
    const content = menu.map((m, index) => {
        switch (m.node) {
            case 'title': {
                const { name, node, ...rest } = m;
                return (
                    <DropdownTitle {...rest} key={node + name + index}>
                        {name}
                    </DropdownTitle>
                );
            }

            case 'item': {
                const { node, name, ...rest } = m;
                return (
                    <DropdownItem {...rest} key={node + name + index}>
                        {name}
                    </DropdownItem>
                );
            }

            case 'divider': {
                const { node, ...rest } = m;
                return <DropdownDivider {...rest} key={node + index} />;
            }

            default:
                return null;
        }
    });
    return <DropdownMenu>{content}</DropdownMenu>;
}

export interface DropdownHandle {
    /** Focuses the trigger (a non-custom trigger only) */
    focusTrigger: () => void;
    /** Repositions the open popup at once; it already follows scrolling, resizing and trigger moves, a move a frame late */
    rePosition: () => void;
}

function Dropdown(rawProps: DropdownProps & { ref?: React.Ref<DropdownHandle> }) {
    const props = useDefaultProps('Dropdown', rawProps, defaultProps);
    const { ref: _ref, children, position, trigger, onVisibleChange: _onVisibleChange, className, motion, style, prefixCls, render, menu, contentClassName, selectionMode, showTick, spacing, ...attr } = props;

    const parentContext = useDropdownContext();
    const { direction } = useConfigContext();

    const tooltipRef = useRef<TooltipHandle>(null);
    const popRef = useRef<HTMLDivElement>(null);

    const [foundation, state] = useFoundation<DropdownFoundation<DropdownProps, DropdownState>, DropdownAdapter<DropdownProps, DropdownState>, DropdownProps, DropdownState>(
        DropdownFoundation,
        props,
        () => ({ popVisible: false }),
        (base) => ({
            setPopVisible: (popVisible) => base.setState({ popVisible }),
            notifyVisibleChange: (visible) => base.getProps().onVisibleChange?.(visible),
            getPopup: () => popRef.current?.closest<HTMLElement>('[popover]') ?? null,
            hidePopup: () => tooltipRef.current?.hide(),
        }),
        { ...parentContext, direction }
    );

    const { menuDepth = 0 } = parentContext;
    const isSubmenu = menuDepth > 0;
    const popVisible = props.visible ?? state.popVisible;
    const content = render ?? (Array.isArray(menu) ? renderMenu(menu) : null);
    const parentCloseAll = parentContext.closeAll;

    const contextValue = useMemo(() => {
        const closeAll = () => {
            foundation.close();
            parentCloseAll?.();
        };
        const getPopupId = () => tooltipRef.current?.getPopupId();
        return { showTick, selectionMode, menuDepth: menuDepth + 1, trigger, close: foundation.close, closeAll, getPopupId };
    }, [foundation, parentCloseAll, showTick, selectionMode, menuDepth, trigger]);

    // moves focus into the menu when Tooltip gives the popup its initial focus
    const focusTarget = useMemo(() => ({ focus: foundation.handleOpened }), [foundation]);

    // text or several nodes get the wrapper Tooltip would add, so onKeyDown reaches a real element
    const child = (isValidElement(children) ? children : wrapSpan(children, props.wrapperClassName)) as React.ReactElement<Record<string, any>>;
    const { className: childClassName, onKeyDown: childKeyDown } = child.props;
    const menuButton = isMenuButton(child);

    // a disabled parent item opens no submenu, and a wrapper span would not be a valid child of the menu
    const isItem = elementTypeOf(child) === 'Dropdown.Item';
    const disabledItem = isItem && Boolean(child.props.disabled);

    const trig = cloneElement(child, {
        className: clsx(childClassName, { [`${prefixCls}-showing`]: popVisible }),
        // undefined also drops what Tooltip would inject for a trigger that cannot carry them
        'aria-haspopup': menuButton ? 'menu' : undefined,
        'aria-expanded': menuButton ? Boolean(popVisible) : undefined,
        // the popup is not a description of the trigger: keep only the child's own
        'aria-describedby': child.props['aria-describedby'],
        onKeyDown: (e: React.KeyboardEvent) => {
            // the child goes first: its preventDefault stops the foundation from clicking twice
            childKeyDown?.(e);
            foundation.handleKeyDown(e, menuButton);
        },
    });

    const renderPop = ({ initialFocusRef }: RenderContentProps) => (
        <DropdownContext value={contextValue}>
            <div
                ref={(node) => {
                    popRef.current = node;
                    initialFocusRef.current = node && focusTarget;
                }}
                className={clsx(prefixCls, contentClassName)}
                style={style}
            >
                <div className={`${prefixCls}-content`} x-semi-prop="render">
                    {content}
                </div>
            </div>
        </DropdownContext>
    );

    useImperativeHandle(
        props.ref,
        () => ({
            focusTrigger: () => tooltipRef.current?.focusTrigger(),
            rePosition: () => tooltipRef.current?.rePosition(),
        }),
        []
    );

    return (
        <Tooltip
            className={className}
            // the popup is an interactive menu, not a tooltip
            role="presentation"
            condition={disabledItem ? false : undefined}
            motion={motion}
            position={position}
            prefixCls={prefixCls}
            returnFocusOnClose
            showArrow={false}
            spacing={spacing ?? (isSubmenu ? numbers.NESTED_SPACING : numbers.SPACING)}
            trigger={trigger}
            wrapWhenSpecial={isItem ? false : undefined}
            onVisibleChange={foundation.handleVisibleChange}
            {...attr}
            ref={tooltipRef}
            content={renderPop}
            // the foundation handles Up and Down on the trigger, so focus moves once
            disableArrowKeyDown
        >
            {trig}
        </Tooltip>
    );
}

export default Object.assign(Dropdown, {
    Menu: DropdownMenu,
    Item: DropdownItem,
    Divider: DropdownDivider,
    Title: DropdownTitle,
});
