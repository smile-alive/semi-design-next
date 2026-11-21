import { children, Show, splitProps, type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { omit } from 'es-toolkit';
import { cssClasses, type ListItemPart } from '@fibrae/semi-foundation/components/list/constants';
import { isAriaKey } from '@fibrae/semi-foundation/utils';
import type { ElementProps } from '../../base/index';
import { splitControlAttrs, forwardFocus, hasContent, mergeRefs, mergeStyles } from '../../utils/index';
import { Col } from '../grid';
import { type ListItemEventHandler, useListContext } from './context';

const prefixCls = cssClasses.PREFIX;

export interface ListItemProps extends ElementProps<'li', 'onClick'> {
    extra?: JSX.Element;
    header?: JSX.Element;
    main?: JSX.Element;
    align?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    /** Applied after the `item*` classNames of the parent List */
    classNames?: Partial<Record<ListItemPart, string>>;
    styles?: Partial<Record<ListItemPart, JSX.CSSProperties | string>>;
    onClick?: ListItemEventHandler;
    onRightClick?: ListItemEventHandler;
}

// Solid delivers a click from a Portal to the handlers of its logical ancestors, where DOM containment fails, so the
// extra marks its own clicks with the li they belong to; a nested List's extra then does not silence the outer item
const extraClicks = new WeakMap<Event, Element | null>();

// The button is the only tab stop, so what a Tooltip injects for focus and naming belongs there, not on the li
const isControlKey = (key: string): key is 'tabIndex' | 'tabindex' | `aria-${string}` => key === 'tabIndex' || key === 'tabindex' || isAriaKey(key);

export default function ListItem(props: ListItemProps) {
    const [local, rest] = splitProps(props, ['align', 'children', 'class', 'classNames', 'extra', 'header', 'main', 'onClick', 'onRightClick', 'ref', 'style', 'styles']);
    const [control, rootAttrs] = splitControlAttrs(rest, isControlKey);

    const list = useListContext();

    let button: HTMLButtonElement | undefined;

    const header = children(() => local.header);
    const main = children(() => local.main);
    const extra = children(() => local.extra);

    const handleClick = () => local.onClick ?? list().onClick;

    const handleRightClick = () => local.onRightClick ?? list().onRightClick;

    const clickable = () => Boolean(handleClick() || handleRightClick());

    const hasBody = () => hasContent(header()) || hasContent(main());

    const align = () => local.align ?? 'flex-start';

    // a button holds phrasing content only
    const box = () => (clickable() ? 'span' : 'div');

    const body = () => (
        <Dynamic component={box()} class={clsx(`${prefixCls}-item-body`, `${prefixCls}-item-body-${align()}`)}>
            <Show when={hasContent(header())}>
                <Dynamic component={box()} class={clsx(`${prefixCls}-item-body-header`, list().classNames?.itemHeader, local.classNames?.header)} style={mergeStyles(list().styles?.itemHeader, local.styles?.header)}>
                    {header()}
                </Dynamic>
            </Show>
            <Show when={hasContent(main())}>
                <Dynamic component={box()} class={clsx(`${prefixCls}-item-body-main`, list().classNames?.itemMain, local.classNames?.main)} style={mergeStyles(list().styles?.itemMain, local.styles?.main)}>
                    {main()}
                </Dynamic>
            </Show>
        </Dynamic>
    );

    const item = (
        <li
            {...(clickable() ? rootAttrs : rest)}
            // Known limit: a non-clickable item given a tabIndex no longer focuses through ref.focus(); install the
            // forward only while the item is clickable if a consumer needs that
            ref={mergeRefs(local.ref, (node: HTMLLIElement) => forwardFocus(node, () => button))}
            class={clsx(`${prefixCls}-item`, { [`${prefixCls}-item-clickable`]: clickable() }, list().classNames?.item, local.class)}
            style={mergeStyles(list().styles?.item, local.style)}
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
                <div class={clsx(`${prefixCls}-item-extra`, list().classNames?.itemExtra, local.classNames?.extra)} style={mergeStyles(list().styles?.itemExtra, local.styles?.extra)} onClick={(e) => extraClicks.set(e, e.currentTarget.parentElement)}>
                    {extra()}
                </div>
            </Show>
        </li>
    );

    return (
        <Show when={list().grid} fallback={item}>
            {(grid) => (
                <Col {...omit(grid(), ['gutter', 'justify', 'align'])} role="none">
                    {item}
                </Col>
            )}
        </Show>
    );
}
