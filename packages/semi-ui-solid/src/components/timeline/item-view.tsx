import { children, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/timeline/constants';
import '@fibrae/semi-foundation/components/timeline/timeline.scss';
import { callHandler, hasContent, mergeStyles } from '../../utils/index';
import { useTimelineContext } from './context';
import type { TimelineItemProps } from './interface';

const prefixCls = cssClasses.ITEM;

// Portal content bubbles through the logical tree, where DOM containment fails, so the extra marks its own clicks
// with the li they belong to; a nested Timeline's extra then does not silence the outer item
const extraClicks = new WeakMap<Event, Element | null>();

export default function TimelineItemView(props: TimelineItemProps) {
    const [local, rest] = splitProps(props, ['children', 'class', 'classNames', 'color', 'dot', 'extra', 'onClick', 'position', 'style', 'styles', 'time', 'type']);

    const timeline = useTimelineContext();

    const dot = children(() => local.dot);
    const extra = children(() => local.extra);
    const time = children(() => local.time);

    return (
        <li
            {...rest}
            class={clsx(prefixCls, timeline().classNames?.item, local.class)}
            style={mergeStyles(timeline().styles?.item, local.style)}
            onClick={(event) => {
                if (extraClicks.get(event) !== event.currentTarget) {
                    callHandler(local.onClick, event);
                }
            }}
        >
            <div class={clsx(`${prefixCls}-tail`, timeline().classNames?.itemRail, local.classNames?.rail)} style={mergeStyles(timeline().styles?.itemRail, local.styles?.rail)} aria-hidden="true" />
            <div
                class={clsx(`${prefixCls}-head`, `${prefixCls}-head-${local.type ?? 'default'}`, { [`${prefixCls}-head-custom`]: hasContent(dot()) }, timeline().classNames?.itemIcon, local.classNames?.icon)}
                style={mergeStyles(local.color ? { 'background-color': local.color } : undefined, timeline().styles?.itemIcon, local.styles?.icon)}
                aria-hidden="true"
            >
                {dot()}
            </div>
            <div class={clsx(`${prefixCls}-content`, timeline().classNames?.itemContent, local.classNames?.content)} style={mergeStyles(timeline().styles?.itemContent, local.styles?.content)}>
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
                    <div class={clsx(`${prefixCls}-content-extra`, timeline().classNames?.itemExtra, local.classNames?.extra)} style={mergeStyles(timeline().styles?.itemExtra, local.styles?.extra)} onClick={(event) => extraClicks.set(event, event.currentTarget.closest('li'))}>
                        {extra()}
                    </div>
                </Show>
                <Show when={hasContent(time())}>
                    <div class={clsx(`${prefixCls}-content-time`, timeline().classNames?.itemTime, local.classNames?.time)} style={mergeStyles(timeline().styles?.itemTime, local.styles?.time)}>
                        {time()}
                    </div>
                </Show>
            </div>
        </li>
    );
}
