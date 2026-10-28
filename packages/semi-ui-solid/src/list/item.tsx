import { children, Show, splitProps, type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { omit } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/list/constants';
import { splitControlAttrs } from '../_base/control-attrs';
import type { ElementProps } from '../_base/element-props';
import forwardFocus from '../_base/forward-focus';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import { Col } from '../grid';
import { type ListItemEventHandler, useListContext } from './context';

const prefixCls = cssClasses.PREFIX;

export interface ListItemProps extends ElementProps<'li', 'onClick'> {
    extra?: JSX.Element;
    header?: JSX.Element;
    main?: JSX.Element;
    align?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    onClick?: ListItemEventHandler;
    onRightClick?: ListItemEventHandler;
}

// Solid delivers a click from a Portal to the handlers of its logical ancestors, where DOM containment fails, so the
// extra marks its own clicks with the li they belong to; a nested List's extra then does not silence the outer item
const extraClicks = new WeakMap<Event, Element | null>();

// The button is the only tab stop, so what a Tooltip injects for focus and naming belongs there, not on the li
const isControlKey = (key: string): key is 'tabIndex' | 'tabindex' | `aria-${string}` => key === 'tabIndex' || key === 'tabindex' || key.startsWith('aria-');

export default function ListItem(props: ListItemProps) {
    const [local, rest] = splitProps(props, ['align', 'children', 'class', 'extra', 'header', 'main', 'onClick', 'onRightClick', 'ref']);
    const [control, rootAttrs] = splitControlAttrs(rest, isControlKey);

    const list = useListContext();

    let button: HTMLButtonElement | undefined;

    const header = children(() => local.header);
    const main = children(() => local.main);
    const extra = children(() => local.extra);

    const handleClick = () => local.onClick || list().onClick;

    const handleRightClick = () => local.onRightClick || list().onRightClick;

    const clickable = () => Boolean(handleClick() || handleRightClick());

    const hasBody = () => hasContent(header()) || hasContent(main());

    const align = () => local.align ?? 'flex-start';

    // a button holds phrasing content only
    const box = () => (clickable() ? 'span' : 'div');

    const body = () => (
        <Dynamic component={box()} class={clsx(`${prefixCls}-item-body`, `${prefixCls}-item-body-${align()}`)}>
            <Show when={hasContent(header())}>
                <Dynamic component={box()} class={`${prefixCls}-item-body-header`}>
                    {header()}
                </Dynamic>
            </Show>
            <Show when={hasContent(main())}>
                <Dynamic component={box()} class={`${prefixCls}-item-body-main`}>
                    {main()}
                </Dynamic>
            </Show>
        </Dynamic>
    );

    // each branch reads the children itself: only one of the two positions is live at a time
    const item = (
        <li
            {...(clickable() ? rootAttrs : rest)}
            // Known limit: a non-clickable item given a tabIndex no longer focuses through ref.focus(); install the
            // forward only while the item is clickable if a consumer needs that
            ref={mergeRefs(local.ref, (node: HTMLLIElement) => forwardFocus(node, () => button))}
            class={clsx(`${prefixCls}-item`, { [`${prefixCls}-item-clickable`]: clickable() }, local.class)}
            onClick={(e) => {
                if (extraClicks.get(e) !== e.currentTarget) {
                    handleClick()?.(e);
                }
            }}
            onContextMenu={(e) => handleRightClick()?.(e)}
        >
            <Show when={clickable()} fallback={<Show when={hasBody()}>{body()}</Show>}>
                {/* extra stays outside so interactive extras are never nested in the button */}
                <button ref={(node) => (button = node)} type="button" class={`${prefixCls}-item-button`} {...control}>
                    <Show when={hasBody()} fallback={local.children}>
                        {body()}
                    </Show>
                </button>
            </Show>
            <Show when={!clickable() || hasBody()}>{local.children}</Show>
            <Show when={hasContent(extra())}>
                <div class={`${prefixCls}-item-extra`} onClick={(e) => extraClicks.set(e, e.currentTarget.parentElement)}>
                    {extra()}
                </div>
            </Show>
        </li>
    );

    return (
        <Show when={list().grid} fallback={item}>
            {(grid) => (
                <Col {...omit(grid(), ['gutter', 'justify', 'type', 'align'])} role="none">
                    {item}
                </Col>
            )}
        </Show>
    );
}
