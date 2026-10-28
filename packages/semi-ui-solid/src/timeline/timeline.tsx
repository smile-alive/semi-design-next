import { children, createMemo, For, Index, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/timeline/constants';
import { getPosCls } from '@fibrae/semi-foundation/timeline/utils';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/timeline/timeline.scss';
import hasContent from '../_base/has-content';
import { isToken, type Token } from '../_base/token';
import useDefaultProps from '../_base/use-default-props';
import type { Data, TimelineItemProps, TimelineProps } from './interface';
import Item, { TIMELINE_ITEM } from './item';
import TimelineItemView from './item-view';

const prefixCls = cssClasses.PREFIX;

const defaultProps = { mode: 'left' } satisfies Partial<TimelineProps>;

const itemProps = ({ content, extra, time, ...item }: Data) => item;

function Timeline(rawProps: TimelineProps) {
    const props = useDefaultProps('Timeline', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['children', 'class', 'dataSource', 'mode', 'renderContent', 'renderDot', 'renderExtra', 'renderTime']);

    const resolved = children(() => local.children);

    const tokens = createMemo(() =>
        resolved.toArray().flatMap((node) => {
            const isItem = isToken<TimelineItemProps>(node, TIMELINE_ITEM);
            warning(!isItem && hasContent(node), '[Semi Timeline] Only Timeline.Item is rendered as a child.');
            return isItem ? [node as Token<TimelineItemProps>] : [];
        })
    );

    return (
        <ul {...rest} class={clsx(prefixCls, local.class, { [`${prefixCls}-${local.mode}`]: local.mode })}>
            <Show
                when={local.dataSource?.length}
                fallback={
                    // the index counts rendered items only, so a skipped child does not take an alternate slot
                    <For each={tokens()}>{(token, index) => <TimelineItemView {...token.props} class={clsx(token.props.class, getPosCls(local.mode, token.props.position, index()))} />}</For>
                }
            >
                <Index each={local.dataSource}>
                    {(item, index) => (
                        <TimelineItemView
                            {...itemProps(item())}
                            class={clsx(item().class, getPosCls(local.mode, item().position, index))}
                            dot={local.renderDot?.(item(), index)}
                            time={local.renderTime ? local.renderTime(item(), index) : item().time}
                            extra={local.renderExtra ? local.renderExtra(item(), index) : item().extra}
                        >
                            {local.renderContent ? local.renderContent(item(), index) : item().content}
                        </TimelineItemView>
                    )}
                </Index>
            </Show>
        </ul>
    );
}

export default Object.assign(Timeline, { Item });
