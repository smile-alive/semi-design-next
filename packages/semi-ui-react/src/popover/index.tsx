import React, { memo, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses, getPopoverRole, getPopoverSpacing } from '@fibrae/semi-foundation/popover/constants';
import { noop } from '@fibrae/semi-foundation/utils/function';
import '@fibrae/semi-foundation/popover/popover.scss';
import type { BaseProps } from '../_base/base-component';
import useDefaultProps from '../_base/use-default-props';
import Tooltip, { type Position, type TooltipHandle, type TooltipProps, type Trigger, type RenderContentProps } from '../tooltip/index';
import Arrow from './arrow';
export type { ArrowProps } from './arrow';
declare interface ArrowStyle {
    borderColor?: string;
    backgroundColor?: string;
    borderOpacity?: string | number;
}

export interface PopoverHandle {
    /** Focuses the trigger (only with returnFocusOnClose and a non-custom trigger) */
    focusTrigger: () => void;
    /** Repositions the open popup at once; it already follows scrolling, resizing and trigger moves, a move a frame late */
    rePosition: () => void;
}

export interface PopoverProps extends BaseProps {
    /** Names the popup when it is a dialog (click, contextMenu or custom trigger) */
    'aria-label'?: string;
    'aria-labelledby'?: string;
    /**
     * Role of the popup; dialog with a click, contextMenu or custom trigger, tooltip otherwise.
     * A combobox passes presentation because it points at the inner listbox itself
     */
    role?: string;
    autoAdjustOverflow?: boolean;
    children?: React.ReactNode;
    content?: TooltipProps['content'];
    visible?: boolean;
    position?: Position;
    motion?: boolean;
    mouseEnterDelay?: number;
    mouseLeaveDelay?: number;
    trigger?: Trigger;
    contentClassName?: string | any[];
    onVisibleChange?: (visible: boolean) => void;
    onClickOutSide?: TooltipProps['onClickOutSide'];
    showArrow?: boolean;
    spacing?: number | { x: number; y: number };
    stopPropagation?: boolean | string;
    arrowStyle?: ArrowStyle;
    arrowPointAtCenter?: boolean;
    prefixCls?: string;
    closeOnEsc?: TooltipProps['closeOnEsc'];
    guardFocus?: TooltipProps['guardFocus'];
    returnFocusOnClose?: TooltipProps['returnFocusOnClose'];
    onEscKeyDown?: TooltipProps['onEscKeyDown'];
    clickToHide?: TooltipProps['clickToHide'];
    // Select and AIChatInput handle the arrow keys themselves
    disableArrowKeyDown?: TooltipProps['disableArrowKeyDown'];
    disableFocusListener?: boolean;
    onOpen?: TooltipProps['onOpen'];
    afterOpen?: TooltipProps['afterOpen'];
    afterClose?: () => void;
    keepDOM?: boolean;
    /**
     * Whether the popover may show; false blocks it
     * @default true
     */
    condition?: boolean;
}

const defaultProps = {
    showArrow: false,
    autoAdjustOverflow: true,
    motion: true,
    trigger: 'hover',
    position: 'bottom',
    prefixCls: cssClasses.PREFIX,
    onClickOutSide: noop,
    onEscKeyDown: noop,
    closeOnEsc: true,
    returnFocusOnClose: true,
    guardFocus: true,
} satisfies Partial<PopoverProps>;

function Popover(rawProps: PopoverProps & { ref?: React.Ref<PopoverHandle> }) {
    const props = useDefaultProps('Popover', rawProps, defaultProps);
    const { ref, children, prefixCls, showArrow, arrowStyle = {}, position, style, trigger, content, contentClassName, spacing: spacingProp, role: roleProp, ...attr } = props;

    const tooltipRef = useRef<TooltipHandle>(null);

    const spacing = getPopoverSpacing(spacingProp, showArrow);
    const arrow = showArrow ? <Arrow arrowStyle={arrowStyle} popStyle={style} position={position} /> : false;
    const role = getPopoverRole(roleProp, trigger);

    const renderPopCard = ({ initialFocusRef }: RenderContentProps) => {
        return (
            <div className={clsx(prefixCls, contentClassName)}>
                <div className={`${prefixCls}-content`}>{typeof content === 'function' ? content({ initialFocusRef }) : content}</div>
            </div>
        );
    };

    useImperativeHandle(ref, () => ({ focusTrigger: () => tooltipRef.current?.focusTrigger(), rePosition: () => tooltipRef.current?.rePosition() }), []);

    return (
        <Tooltip ref={tooltipRef} guardFocus {...(attr as TooltipProps)} style={style} role={role} content={renderPopCard} position={position} prefixCls={prefixCls} showArrow={arrow} spacing={spacing} trigger={trigger}>
            {children}
        </Tooltip>
    );
}

export default memo(Popover);
