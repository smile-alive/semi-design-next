import { children, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/timeline/constants';
import '@fibrae/semi-foundation/timeline/timeline.scss';
import callHandler from '../_base/call-handler';
import hasContent from '../_base/has-content';
import type { TimelineItemProps } from './interface';

const prefixCls = cssClasses.ITEM;

// Portal content bubbles through the logical tree, where DOM containment fails, so the extra marks its own clicks
// with the li they belong to; a nested Timeline's extra then does not silence the outer item
const extraClicks = new WeakMap<Event, Element | null>();

export default function TimelineItemView(props: TimelineItemProps) {
    const [local, rest] = splitProps(props, ['children', 'class', 'color', 'dot', 'extra', 'onClick', 'position', 'time', 'type']);

    const dot = children(() => local.dot);
    const extra = children(() => local.extra);
    const time = children(() => local.time);

    return (
        <li
            {...rest}
            class={clsx(prefixCls, local.class)}
            onClick={(event) => {
                // Interactive content in extra must not also trigger the item
                if (extraClicks.get(event) !== event.currentTarget) {
                    callHandler(local.onClick, event);
                }
            }}
        >
            <div class={`${prefixCls}-tail`} aria-hidden="true" />
            <div class={clsx(`${prefixCls}-head`, `${prefixCls}-head-${local.type ?? 'default'}`, { [`${prefixCls}-head-custom`]: hasContent(dot()) })} style={local.color ? { 'background-color': local.color } : undefined} aria-hidden="true">
                {dot()}
            </div>
            <div class={`${prefixCls}-content`}>
                {/* The li stays a plain list item; only a clickable item exposes its children as the keyboard target,
                    so extra and time are not nested inside the button. The click bubbles to the li, so onClick runs
                    once with a real MouseEvent. */}
                <Show when={local.onClick} fallback={local.children}>
                    <div
                        class={`${prefixCls}-content-main`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                                event.preventDefault();
                                event.currentTarget.click();
                            }
                        }}
                    >
                        {local.children}
                    </div>
                </Show>
                <Show when={hasContent(extra())}>
                    <div class={`${prefixCls}-content-extra`} onClick={(event) => extraClicks.set(event, event.currentTarget.closest('li'))}>
                        {extra()}
                    </div>
                </Show>
                <Show when={hasContent(time())}>
                    <div class={`${prefixCls}-content-time`}>{time()}</div>
                </Show>
            </div>
        </li>
    );
}
