import { For, Show, children, createEffect, createMemo, onCleanup, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/anchor/constants';
import isEnterPress from '@fibrae/semi-foundation/utils/is-enter-press';
import Typography from '../typography';
import { useAnchorContext } from './context';
import type { AnchorClickEvent } from './interface';
import { type Entry, type LinkNode, hrefOf } from './tree';

const prefixCls = cssClasses.PREFIX;

interface LinkItemProps {
    link: LinkNode;
    /** Nesting depth: 1 under Anchor, one more under each link */
    level: number;
}

export function Entries(props: { entries: Entry[]; level: number }) {
    return <For each={props.entries}>{(entry) => ('link' in entry ? <LinkItem link={entry.link} level={props.level} /> : entry.content)}</For>;
}

export default function LinkItem(props: LinkItemProps) {
    // an entry never changes its link: a new Link element makes a new entry and so a new LinkItem
    const [local, rest] = splitProps(
        untrack(() => props.link.props),
        ['children', 'class', 'disabled', 'href', 'title']
    );

    const anchor = useAnchorContext('Anchor.Link');

    const title = children(() => local.title ?? '');
    const view = anchor.view;
    const href = createMemo(() => hrefOf(props.link));
    const active = createMemo(() => view().activeLink === href());
    const expanded = createMemo(() => !view().autoCollapse || active() || Boolean(view().childMap[href()]?.has(view().activeLink)));

    const tooltip = createMemo(() => {
        const { showTooltip, position } = view();
        const config = typeof showTooltip === 'object' ? showTooltip : {};
        // The position can be set through showTooltip; a copy keeps the caller's object as it was
        return { ...config, opts: position ? { ...config.opts, position } : { ...config.opts } };
    });

    const nativeTitle = () => {
        const text = title();
        return !view().showTooltip && typeof text === 'string' && text ? text : undefined;
    };

    const handleClick = (e: AnchorClickEvent) => {
        if (!local.disabled) {
            anchor.onClick(e, href());
        }
    };

    // registering writes Anchor's state, which the component body must not do
    createEffect(() => {
        const link = href();
        anchor.addLink(link);
        onCleanup(() => anchor.removeLink(link));
    });

    return (
        <div {...rest} class={clsx(`${prefixCls}-link`, local.class)} role="listitem">
            <div
                class={clsx(`${prefixCls}-link-title`, {
                    [`${prefixCls}-link-title-active`]: active(),
                    [`${prefixCls}-link-title-disabled`]: local.disabled,
                })}
                style={{ 'padding-inline-start': `${8 * props.level}px` }}
                aria-current={active() ? 'location' : undefined}
                aria-disabled={Boolean(local.disabled)}
                role="link"
                tabIndex={0}
                title={nativeTitle()}
                onClick={handleClick}
                onKeyDown={(e) => {
                    if (isEnterPress(e)) {
                        // else the same Enter also presses a button that onClick moved focus to
                        e.preventDefault();
                        handleClick(e);
                    }
                }}
            >
                <Show when={view().showTooltip} fallback={title()}>
                    <Typography.Text
                        type="tertiary"
                        class={clsx(`${prefixCls}-link-tooltip`, {
                            [`${prefixCls}-link-tooltip-small`]: view().size === 'small',
                            [`${prefixCls}-link-tooltip-active`]: active(),
                            [`${prefixCls}-link-tooltip-disabled`]: local.disabled,
                        })}
                        // the link title is the Tab stop; the ellipsis Tooltip would add another
                        tabIndex={-1}
                        ellipsis={{ showTooltip: tooltip() }}
                        size={view().size === 'default' ? 'normal' : 'small'}
                    >
                        {title()}
                    </Typography.Text>
                </Show>
            </div>
            <Show when={expanded()}>
                <div role="list">
                    <Entries entries={props.link.entries()} level={props.level + 1} />
                </div>
            </Show>
        </div>
    );
}
