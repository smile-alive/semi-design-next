import { type JSX, type Ref, For, Show, children, createMemo, createSignal, mergeProps, onCleanup, onMount, splitProps } from 'solid-js';
import { isServer } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/dropdown/constants';
import DropdownFoundation, { type DropdownAdapter, type DropdownBaseState } from '@fibrae/semi-foundation/dropdown/foundation';
import type { DropdownSelectionMode } from '@fibrae/semi-foundation/dropdown/menu-foundation';
import { cssClasses as tooltipClasses } from '@fibrae/semi-foundation/tooltip/constants';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/dropdown/dropdown.scss';
import callHandler from '../_base/call-handler';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useConfig from '../config-provider/use-config';
import Tooltip, { type GetTriggerProps, type RenderContentProps, type TooltipHandle, type TooltipProps, type TooltipTriggerProps, type TriggerOwnProps, canCarryPopupState } from '../tooltip';
import { DropdownContext, type DropdownContextValue, menuContext, menuItems, useDropdownContext } from './context';
import DropdownDivider, { type DropdownDividerProps } from './dropdown-divider';
import DropdownItem, { type DropdownItemProps } from './dropdown-item';
import DropdownMenu from './dropdown-menu';
import DropdownTitle, { type DropdownTitleProps } from './dropdown-title';

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

/** What Dropdown puts on the trigger element on top of Tooltip's; every key is a live getter */
export type DropdownTriggerProps = TooltipTriggerProps & {
    class: string;
    onKeyDown: (event: KeyboardEvent) => void;
};

/** Tooltip's getTriggerProps rules; the trigger's own `class` and `onKeyDown` also go in `own` to be merged */
export type GetDropdownTriggerProps = <const P extends TriggerOwnProps = Record<never, never>>(own?: P) => Omit<P, keyof DropdownTriggerProps | 'tabindex'> & DropdownTriggerProps;

// No ElementProps: Dropdown has no root DOM, so undeclared props are dropped (F11)
export interface DropdownProps extends Omit<TooltipProps, 'children' | 'content' | 'disableArrowKeyDown'> {
    /**
     * A function (declare its parameter) gets getTriggerProps for the element that takes focus, such as a Button or
     * the Dropdown.Item of a submenu; anything else is wrapped in a span
     */
    children?: JSX.Element | ((getTriggerProps: GetDropdownTriggerProps) => JSX.Element);
    /** The popup content; takes precedence over `menu` */
    render?: JSX.Element;
    menu?: DropDownMenuItem[];
    /** On the menu container `.semi-dropdown` */
    contentClassName?: string;
    /** On the menu container `.semi-dropdown`; `class` goes on the popup */
    style?: JSX.CSSProperties | string;
    /**
     * How the items are selected (a submenu uses its own Dropdown's value); `active` marks selected items:
     * - 'single': role="menuitemradio" with aria-checked;
     * - 'multiple': role="menuitemcheckbox" with aria-checked;
     * - unset: menuitemcheckbox with aria-checked when showTick is on, otherwise menuitem without aria-checked.
     */
    selectionMode?: DropdownSelectionMode;
    showTick?: boolean;
}

export interface DropdownHandle {
    /** Focuses the trigger (a non-custom trigger only) */
    focusTrigger: () => void;
    /** Repositions the open popup at once; it already follows scrolling, resizing and trigger moves, a move a frame late */
    rePosition: () => void;
}

type Foundation = DropdownFoundation<DropdownProps, DropdownBaseState>;
type Adapter = DropdownAdapter<DropdownProps, DropdownBaseState>;

const defaultProps = {
    prefixCls: cssClasses.PREFIX,
    motion: true,
    trigger: 'hover',
    position: 'bottom',
    mouseLeaveDelay: strings.DEFAULT_LEAVE_DELAY,
    showTick: false,
    closeOnEsc: true,
    // the popup is an interactive menu, not a tooltip
    role: 'presentation',
    returnFocusOnClose: true,
} satisfies Partial<DropdownProps>;

function renderMenuItem(item: DropDownMenuItem) {
    const { node, name, ...rest } = item as DropDownMenuItem & { name?: string };
    switch (node) {
        case 'title':
            return <DropdownTitle {...(rest as DropdownTitleProps)}>{name}</DropdownTitle>;
        case 'item':
            return <DropdownItem {...(rest as DropdownItemProps)}>{name}</DropdownItem>;
        case 'divider':
            return <DropdownDivider {...(rest as DropdownDividerProps)} />;
        default:
            return null;
    }
}

export default function Dropdown(rawProps: DropdownProps & { ref?: Ref<DropdownHandle> }) {
    const props = useDefaultProps('Dropdown', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['ref', 'children', 'style', 'render', 'menu', 'contentClassName', 'selectionMode', 'showTick', 'spacing', 'condition', 'onVisibleChange']);

    const parent = useDropdownContext();
    const config = useConfig();

    const [triggerElement, setTriggerElement] = createSignal<HTMLElement>();
    const [focusableInside, setFocusableInside] = createSignal(false);
    let tooltip: TooltipHandle | undefined;
    let menuContainer: HTMLDivElement | undefined;
    let wrapper: HTMLSpanElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, DropdownProps, DropdownBaseState>(
        DropdownFoundation,
        props,
        () => ({ popVisible: false }),
        (base) => ({
            setPopVisible: (popVisible) => base.setState({ popVisible }),
            notifyVisibleChange: (visible) => props.onVisibleChange?.(visible),
            getPopup: () => menuContainer?.closest<HTMLElement>('[popover]') ?? null,
            hidePopup: () => tooltip?.hide(),
        }),
        { context: () => menuContext(parent, config().direction) }
    );

    const ref = props.ref;

    // moves focus into the menu when Tooltip gives the popup its initial focus
    const focusTarget = { focus: () => foundation.handleOpened() };
    const handle: DropdownHandle = { focusTrigger: () => tooltip?.focusTrigger(), rePosition: () => tooltip?.rePosition() };
    const view = createMemo(() => ({ menuDepth: (parent?.view().menuDepth ?? 0) + 1, showTick: props.showTick, selectionMode: local.selectionMode, trigger: props.trigger }));

    const context: DropdownContextValue = {
        view,
        close: () => foundation.close(),
        closeAll: () => {
            foundation.close();
            parent?.closeAll();
        },
        getPopupId: () => tooltip?.getPopupId() ?? '',
    };

    const popVisible = () => props.visible ?? state().popVisible;

    const isSubmenu = () => (parent?.view().menuDepth ?? 0) > 0;

    const disabledItem = () => {
        const el = triggerElement();
        return Boolean(el && menuItems.get(el)?.());
    };

    // Tooltip's getTriggerProps plus the menu button of the APG pattern
    const withMenuButton =
        (getTooltipProps: GetTriggerProps): GetDropdownTriggerProps =>
        (own = {} as never) => {
            const [mine, others] = splitProps(own as TriggerOwnProps & { class?: string; onKeyDown?: JSX.EventHandlerUnion<HTMLElement, KeyboardEvent> }, ['ref', 'class', 'onKeyDown']);
            // aria-haspopup and aria-expanded only fit a button, a link, a parent item or an element with such a role
            const menuButton = () => {
                const el = triggerElement();
                return Boolean(el && (menuItems.has(el) || canCarryPopupState(el, own.role)));
            };
            return getTooltipProps(
                mergeProps(others, {
                    ref: (element: HTMLElement) => {
                        (mine.ref as ((element: HTMLElement) => void) | undefined)?.(element);
                        setTriggerElement(element);
                    },
                    get class() {
                        return clsx(mine.class, { [`${props.prefixCls}-showing`]: popVisible() });
                    },
                    // null also drops a value the trigger set itself
                    get 'aria-haspopup'() {
                        return menuButton() ? 'menu' : null;
                    },
                    get 'aria-expanded'() {
                        return menuButton() ? popVisible() : null;
                    },
                    onKeyDown: (e: KeyboardEvent & { currentTarget: HTMLElement; target: Element }) => {
                        // the trigger goes first: its preventDefault stops the foundation from clicking twice
                        callHandler(mine.onKeyDown, e);
                        foundation.handleKeyDown(e, menuButton());
                    },
                })
            ) as never;
        };

    // under Tooltip's providers, so components rendered in the trigger see them
    const renderTrigger = (getTooltipProps: GetTriggerProps) => {
        const getTriggerProps = withMenuButton(getTooltipProps);
        const resolved = children(() => local.children as JSX.Element);
        const render = resolved() as unknown;
        // children() expands zero-arity functions only, so a function that is still here takes getTriggerProps
        if (typeof render === 'function') {
            return (render as (get: GetDropdownTriggerProps) => JSX.Element)(getTriggerProps);
        }
        // a text node only reaches here in the browser; the server gives text as strings
        const textOnly = () => resolved.toArray().every((node) => typeof node === 'string' || typeof node === 'number' || (!isServer && node instanceof Text));
        // Tooltip's own span would be out of reach of the keyboard handling
        return (
            <span
                {...getTriggerProps({
                    ref: (node: HTMLSpanElement) => (wrapper = node),
                    get class() {
                        return clsx(`${tooltipClasses.PREFIX}-trigger-wrapper`, props.wrapperClassName);
                    },
                    get style() {
                        return { display: textOnly() ? undefined : 'inline-block' };
                    },
                    get tabIndex() {
                        return focusableInside() ? -1 : undefined;
                    },
                })}
            >
                {resolved()}
            </span>
        );
    };

    // inside the Provider, so a submenu rendered here reads this menu's context
    const renderMenu = () => {
        const render = children(() => local.render);
        return (
            <div
                ref={(node) => {
                    menuContainer = node;
                    onCleanup(() => (menuContainer = undefined));
                }}
                class={clsx(props.prefixCls, local.contentClassName)}
                style={local.style}
            >
                <div class={`${props.prefixCls}-content`} x-semi-prop="render">
                    <Show when={render() == null && local.menu} fallback={render()}>
                        {(menu) => (
                            <DropdownMenu>
                                <For each={menu()}>{renderMenuItem}</For>
                            </DropdownMenu>
                        )}
                    </Show>
                </div>
            </div>
        );
    };

    const renderPopup = ({ initialFocusRef }: RenderContentProps) => {
        initialFocusRef(focusTarget);
        return <DropdownContext.Provider value={context}>{renderMenu()}</DropdownContext.Provider>;
    };

    onMount(() => {
        // one Tab stop: a focusable child keeps it
        const inside = Boolean(wrapper && FocusTrapHandle.getFocusableElements(wrapper).length);
        setFocusableInside(inside);
        warning(inside, '[Semi Dropdown] the trigger holds a focusable element; pass children as (getTriggerProps) => JSX');
    });

    // delivered once while created, like an element ref; the methods read the popup only when called
    if (typeof ref === 'function') {
        ref(handle);
    }

    return (
        <Tooltip
            showArrow={false}
            {...rest}
            ref={(instance: TooltipHandle) => (tooltip = instance)}
            content={renderPopup}
            // the foundation handles Up and Down on the trigger, so focus moves once
            disableArrowKeyDown
            spacing={local.spacing ?? (isSubmenu() ? numbers.NESTED_SPACING : numbers.SPACING)}
            // a disabled parent item opens no submenu
            condition={disabledItem() ? false : local.condition}
            onVisibleChange={(visible) => foundation.handleVisibleChange(visible)}
        >
            {(getTooltipProps: GetTriggerProps) => renderTrigger(getTooltipProps)}
        </Tooltip>
    );
}
