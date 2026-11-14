import type React from 'react';
import { cloneElement, isValidElement, useImperativeHandle, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses, strings, type DropdownPart } from '@fibrae/semi-foundation/components/dropdown/constants';
import DropdownFoundation, { type DropdownAdapter, type DropdownBaseState } from '@fibrae/semi-foundation/components/dropdown/foundation';
import type { DropdownSelectionMode } from '@fibrae/semi-foundation/components/dropdown/menu-foundation';
import '@fibrae/semi-foundation/components/dropdown/dropdown.scss';
import { useDefaultProps, useFoundation } from '../../base/index';
import { useUnwrappedLazy } from '../../hooks/index';
import { elementTypeOf } from '../../utils/index';
import { useConfigContext } from '../config-provider/context';
import Tooltip, { type Position, type RenderContentProps, type TooltipHandle, type TooltipInternalProps, type TooltipProps, type Trigger, canCarryPopupState, wrapSpan } from '../tooltip/index';
import { DropdownContext, useDropdownContext } from './context';
import DropdownDivider, { type DropdownDividerProps } from './dropdown-divider';
import DropdownItem, { type DropdownItemProps } from './dropdown-item';
import DropdownMenu from './dropdown-menu';
import DropdownTitle, { type DropdownTitleProps } from './dropdown-title';

type Foundation = DropdownFoundation<DropdownProps>;
type Adapter = DropdownAdapter<DropdownProps>;

const InternalTooltip = Tooltip as (props: TooltipInternalProps & { ref?: React.Ref<TooltipHandle> }) => React.ReactNode;

const prefixCls = cssClasses.PREFIX;

export type { DropdownDividerProps } from './dropdown-divider';
export type { DropdownItemProps, Type } from './dropdown-item';
export type { DropdownMenuProps } from './dropdown-menu';
export type { DropdownTitleProps } from './dropdown-title';

export interface DropdownMenuItemType extends Omit<DropdownItemProps, 'children'> {
    node: 'item';
    name?: string;
}
export interface DropdownMenuItemDividerType extends DropdownDividerProps {
    node: 'divider';
}
export interface DropdownMenuItemTitleType extends Omit<DropdownTitleProps, 'children'> {
    node: 'title';
    name?: string;
}

export type DropdownMenuItem = DropdownMenuItemType | DropdownMenuItemDividerType | DropdownMenuItemTitleType;

export interface DropdownProps extends Omit<TooltipProps, 'classNames' | 'disableArrowKeyDown' | 'styles'> {
    render?: React.ReactNode;
    children?: React.ReactNode;
    visible?: boolean;
    position?: Position;
    mouseEnterDelay?: number;
    mouseLeaveDelay?: number;
    menu?: DropdownMenuItem[];
    trigger?: Trigger;
    motion?: boolean;
    className?: string;
    classNames?: Partial<Record<DropdownPart, string>>;
    style?: React.CSSProperties;
    styles?: Partial<Record<DropdownPart, React.CSSProperties>>;
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

const defaultProps = {
    motion: true,
    trigger: 'hover',
    position: 'bottom',
    mouseLeaveDelay: strings.DEFAULT_LEAVE_DELAY,
    showTick: false,
    closeOnEsc: true,
} satisfies Partial<DropdownProps>;

/** Whether the trigger can carry the menu button attributes; a Dropdown.Item with a submenu is a menuitem */
function isMenuButton(child: React.ReactElement<Record<string, any>>) {
    return elementTypeOf(child) === 'Dropdown.Item' || canCarryPopupState(child);
}

function renderMenu(menu: DropdownMenuItem[]) {
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
    const { ref: _ref, children, position, trigger, onVisibleChange: _onVisibleChange, className, motion, style, styles, render, menu, classNames, selectionMode, showTick, spacing, ...attr } = props;

    const parentContext = useDropdownContext();
    const { direction } = useConfigContext();
    const triggerNode = useUnwrappedLazy(children);

    const tooltipRef = useRef<TooltipHandle>(null);

    const [foundation, state] = useFoundation<Foundation, Adapter, DropdownProps, DropdownBaseState>(
        DropdownFoundation,
        props,
        () => DropdownFoundation.getInitialState(),
        (base) => ({
            notifyVisibleChange: (visible) => base.getProps().onVisibleChange?.(visible),
            getPopup: () => tooltipRef.current?.getPopup() ?? null,
            hidePopup: () => tooltipRef.current?.hide(),
        }),
        { ...parentContext, direction }
    );

    const { menuDepth } = parentContext;
    const popVisible = props.visible ?? state.popVisible;
    const content = render ?? (Array.isArray(menu) ? renderMenu(menu) : null);

    const contextValue = useMemo(() => {
        const getPopupId = () => tooltipRef.current?.getPopupId();
        return { showTick, selectionMode, menuDepth: DropdownFoundation.getChildMenuDepth(menuDepth), trigger, close: foundation.close, closeAll: foundation.closeAll, getPopupId };
    }, [foundation, showTick, selectionMode, menuDepth, trigger]);

    // moves focus into the menu when Tooltip gives the popup its initial focus
    const focusTarget = useMemo(() => ({ focus: foundation.handleOpened }), [foundation]);

    // text or several nodes get the wrapper Tooltip would add, so onKeyDown reaches a real element
    const child = (isValidElement(triggerNode) ? triggerNode : wrapSpan(triggerNode, classNames?.wrapper, styles?.wrapper)) as React.ReactElement<Record<string, any>>;
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
                    initialFocusRef.current = node && focusTarget;
                }}
                className={clsx(prefixCls, classNames?.content)}
                style={{ ...style, ...styles?.content }}
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
        <InternalTooltip
            className={className}
            classNames={{ wrapper: classNames?.wrapper }}
            styles={{ wrapper: styles?.wrapper }}
            // the popup is an interactive menu, not a tooltip
            role="presentation"
            condition={disabledItem ? false : undefined}
            motion={motion}
            position={position}
            prefixCls={prefixCls}
            returnFocusOnClose
            showArrow={false}
            spacing={DropdownFoundation.getSpacing(spacing, menuDepth)}
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
        </InternalTooltip>
    );
}

export default Dropdown;
