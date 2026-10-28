import { type JSX, type Ref, splitProps } from 'solid-js';
import clsx, { type ClassValue } from 'clsx';
import { cssClasses, getPopoverRole, getPopoverSpacing } from '@fibrae/semi-foundation/popover/constants';
import '@fibrae/semi-foundation/popover/popover.scss';
import useDefaultProps from '../_base/use-default-props';
import Tooltip, { PopupContent, type Position, type RenderContentProps, type TooltipHandle, type TooltipProps, type Trigger } from '../tooltip';
import Arrow, { type ArrowStyle } from './arrow';

export interface PopoverHandle {
    /** Focuses the trigger (only with returnFocusOnClose and a non-custom trigger) */
    focusTrigger: () => void;
    /** Repositions the open popup at once; it already follows scrolling, resizing and trigger moves, a move a frame late */
    rePosition: () => void;
}

// No ElementProps: Popover has no root DOM, so undeclared props are dropped (F11)
export interface PopoverProps {
    /** Names the popup when it is a dialog (click, contextMenu or custom trigger) */
    'aria-label'?: string;
    'aria-labelledby'?: string;
    /**
     * Role of the popup; dialog with a click, contextMenu or custom trigger, tooltip otherwise.
     * A combobox passes presentation because it points at the inner listbox itself
     */
    role?: string;
    /** On the popup */
    class?: string;
    /** On the popup; the arrow color reads `background-color` and `border-color` of an object style only */
    style?: JSX.CSSProperties | string;
    autoAdjustOverflow?: boolean;
    /** A function (declare its parameter) gets getTriggerProps for the element that takes focus; anything else is wrapped in Tooltip's span */
    children?: TooltipProps['children'];
    content?: TooltipProps['content'];
    visible?: boolean;
    position?: Position;
    motion?: boolean;
    mouseEnterDelay?: number;
    mouseLeaveDelay?: number;
    trigger?: Trigger;
    contentClassName?: ClassValue;
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
    closeOnEsc: true,
    returnFocusOnClose: true,
    guardFocus: true,
} satisfies Partial<PopoverProps>;

export default function Popover(rawProps: PopoverProps & { ref?: Ref<PopoverHandle> }) {
    const props = useDefaultProps('Popover', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['arrowStyle', 'children', 'class', 'content', 'contentClassName', 'position', 'prefixCls', 'ref', 'role', 'showArrow', 'spacing', 'style', 'trigger']);

    let tooltip: TooltipHandle | undefined;

    const ref = props.ref;

    const spacing = () => getPopoverSpacing(local.spacing, local.showArrow);

    const role = () => getPopoverRole(local.role, local.trigger);

    const arrow = () => (local.showArrow ? <Arrow arrowStyle={local.arrowStyle} popStyle={typeof local.style === 'object' ? local.style : undefined} position={local.position} /> : false);

    const renderPopCard = (renderProps: RenderContentProps) => (
        <div class={clsx(local.prefixCls, local.contentClassName)}>
            <div class={`${local.prefixCls}-content`}>
                <PopupContent content={local.content} renderProps={renderProps} />
            </div>
        </div>
    );

    // delivered once while created, like an element ref
    if (typeof ref === 'function') {
        ref({ focusTrigger: () => tooltip?.focusTrigger(), rePosition: () => tooltip?.rePosition() });
    }

    return (
        <Tooltip {...(rest as TooltipProps)} ref={(instance) => (tooltip = instance)} class={local.class} style={local.style} role={role()} content={renderPopCard} position={local.position} prefixCls={local.prefixCls} showArrow={arrow()} spacing={spacing()} trigger={local.trigger}>
            {local.children}
        </Tooltip>
    );
}
