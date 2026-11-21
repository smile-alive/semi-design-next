import { type JSX, Show, children, createMemo, createUniqueId, mergeProps, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, type CollapsePanelPart, type CollapsePart } from '@fibrae/semi-foundation/components/collapse/constants';
import CollapseFoundation from '@fibrae/semi-foundation/components/collapse/foundation';
import { isEventInside } from '@fibrae/semi-foundation/utils';
import { IconChevronDown, IconChevronUp } from '@fibrae/semi-icons-solid';
import { type ElementProps, useDefaultProps } from '../../base/index';
import { hasContent, mergeStyles } from '../../utils/index';
import Collapsible from '../collapsible';
import { useCollapseContext } from './context';

type Style = JSX.CSSProperties | string;

export interface CollapsePanelProps extends ElementProps<'div'> {
    classNames?: Partial<Record<CollapsePanelPart, string>>;
    styles?: Partial<Record<CollapsePanelPart, Style>>;
    itemKey: string;
    extra?: JSX.Element;
    header?: JSX.Element;
    children?: JSX.Element;
    showArrow?: boolean;
    disabled?: boolean;
    onMotionEnd?: () => void;
}

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    showArrow: true,
    disabled: false,
} satisfies Partial<CollapsePanelProps>;

export default function CollapsePanel(rawProps: CollapsePanelProps) {
    const props = mergeProps(defaultProps, rawProps);
    const [local, rest] = splitProps(props, ['class', 'classNames', 'style', 'styles', 'children', 'itemKey', 'header', 'extra', 'showArrow', 'disabled', 'onMotionEnd']);

    const context = useCollapseContext('Collapse.Panel');

    // Collapsible fills a keepDOM that Collapse leaves undefined from its own global defaults; resolve it the same way
    // so aria-controls follows the content it points at
    const collapsible = useDefaultProps(
        'Collapsible',
        {
            get keepDOM() {
                return context.view().keepDOM;
            },
        },
        { keepDOM: false }
    );

    const id = createUniqueId();
    let button!: HTMLButtonElement;
    let icon: HTMLSpanElement | undefined;

    const ariaID = `${prefixCls}-${id}`;
    const headerID = `${ariaID}-header`;
    const header = children(() => local.header);
    const extra = children(() => local.extra);
    const active = createMemo(() => context.view().activeSet.has(local.itemKey));

    // The parent Collapse's item* parts come first, the panel's own parts after them
    const partClass = (itemKey: CollapsePart, key?: CollapsePanelPart) => clsx(context.view().classNames?.[itemKey], key && local.classNames?.[key]);

    const partStyle = (itemKey: CollapsePart, key?: CollapsePanelPart) => mergeStyles(context.view().styles?.[itemKey], key && local.styles?.[key]);

    // Reading children creates the content, which must wait until Collapsible shows it, so only the key is checked:
    // children that evaluate to nothing still count as a body
    const hasBody = () => 'children' in local;

    // derived before the DOM updates, so the first render that shows the panel already counts it as opened
    const everOpened = createMemo((previous: boolean) => CollapseFoundation.isEverOpened({ hasBody: hasBody(), active: active(), everOpened: previous }), false);

    const contentMounted = () => CollapseFoundation.isContentMounted({ hasBody: hasBody(), active: active(), keepDOM: Boolean(collapsible.keepDOM), lazyRender: context.view().lazyRender, everOpened: everOpened() });

    const expandIconEnable = () => hasBody() && !local.disabled;

    const iconLeft = () => context.view().expandIconPosition === 'left';

    const hasRight = () => typeof header() === 'string' || hasContent(extra());

    // Each branch reads its own icon: reading creates it, and the branch not shown would leave it uninserted.
    // null stands for "no icon", so only undefined falls back to the default chevron.
    const iconOr = (icon: JSX.Element, Default: typeof IconChevronDown) => (icon === undefined ? <Default /> : icon);

    const arrow = () => (
        <Show when={local.showArrow}>
            <span ref={(node) => (icon = node)} class={clsx(`${prefixCls}-header-icon`, { [`${prefixCls}-header-iconDisabled`]: !expandIconEnable() }, partClass('itemIcon', 'icon'))} style={partStyle('itemIcon', 'icon')} aria-hidden="true">
                <Show when={expandIconEnable() && active()} fallback={iconOr(context.expandIcon(), IconChevronDown)}>
                    {iconOr(context.collapseIcon(), IconChevronUp)}
                </Show>
            </span>
        </Show>
    );

    const handleHeaderClick = (event: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        // The button's click (Enter, Space, assistive tech) bubbles here, so a handler on the button would toggle twice.
        // Solid bubbles a Portal's events to the logical parent: a click inside a popup that extra or header renders is
        // not on this header.
        if (!isEventInside(event, event.currentTarget)) {
            return;
        }
        if (!local.disabled && (context.view().clickHeaderToExpand || button.contains(event.target) || icon?.contains(event.target))) {
            context.onClick(local.itemKey, event);
        }
    };

    return (
        <div {...rest} class={clsx(local.class, `${prefixCls}-item`, { [`${prefixCls}-item-active`]: active() }, partClass('item'))} style={mergeStyles(context.view().styles?.item, local.style)}>
            <div
                class={clsx(
                    `${prefixCls}-header`,
                    {
                        [`${prefixCls}-header-disabled`]: local.disabled,
                        [`${prefixCls}-header-iconLeft`]: iconLeft(),
                    },
                    partClass('itemHeader', 'header')
                )}
                style={partStyle('itemHeader', 'header')}
                onClick={handleHeaderClick}
            >
                <Show when={iconLeft()}>{arrow()}</Show>
                {/* APG heading; role="heading" so host h3 styles cannot beat Semi layers; level 3 as in Radix Accordion */}
                <div class={clsx(`${prefixCls}-header-title`, partClass('itemTitle', 'title'))} style={partStyle('itemTitle', 'title')} aria-level={3} role="heading">
                    <button ref={(node) => (button = node)} id={headerID} type="button" class={`${prefixCls}-header-button`} aria-controls={contentMounted() ? ariaID : undefined} aria-expanded={active()} disabled={local.disabled}>
                        {header()}
                    </button>
                </div>
                {/* extra sits outside the button so it may hold its own controls */}
                <Show when={hasRight()} fallback={<Show when={!iconLeft()}>{arrow()}</Show>}>
                    <span class={`${prefixCls}-header-right`}>
                        <span class={clsx(`${prefixCls}-header-extra`, partClass('itemExtra', 'extra'))} style={partStyle('itemExtra', 'extra')}>
                            {extra()}
                        </span>
                        <Show when={!iconLeft()}>{arrow()}</Show>
                    </span>
                </Show>
            </div>
            <Show when={hasBody()}>
                <Collapsible isOpen={active()} keepDOM={collapsible.keepDOM} motion={context.view().motion} lazyRender={context.view().lazyRender} onMotionEnd={local.onMotionEnd}>
                    <div id={ariaID} class={clsx(`${prefixCls}-content`, partClass('itemBody', 'body'))} style={partStyle('itemBody', 'body')} aria-labelledby={headerID} inert={!active()} role="region">
                        <div class={`${prefixCls}-content-wrapper`}>{local.children}</div>
                    </div>
                </Collapsible>
            </Show>
        </div>
    );
}
