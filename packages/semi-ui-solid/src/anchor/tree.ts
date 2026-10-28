import { type Accessor, type JSX, children, createMemo } from 'solid-js';
import type { AnchorNode } from '@fibrae/semi-foundation/anchor/foundation';
import hasContent from '../_base/has-content';
import { isToken } from '../_base/token';
import type { LinkProps } from './interface';
import { LINK } from './link';

export interface LinkNode {
    props: LinkProps;
    entries: Accessor<Entry[]>;
}

/** What sits in a link list: a link, or any other content, which is rendered as it is */
export type Entry = { link: LinkNode } | { content: JSX.Element };

/**
 * Resolves `source` once and reads the children of every link in it, so each JSX field is read at one place. Links are
 * resolved even when autoCollapse leaves them unmounted: the active link's ancestors must stay expanded.
 */
export function collectEntries(source: () => JSX.Element): Accessor<Entry[]> {
    const resolved = children(source);
    return createMemo(() =>
        resolved
            .toArray()
            .filter(hasContent)
            .map((node): Entry => (isToken<LinkProps>(node, LINK) ? { link: { props: node.props, entries: collectEntries(() => node.props.children) } } : { content: node }))
    );
}

export const hrefOf = (link: LinkNode) => link.props.href ?? '#';

export function toAnchorNodes(entries: Entry[]): AnchorNode[] {
    return entries.flatMap((entry) => ('link' in entry ? [{ href: hrefOf(entry.link), children: toAnchorNodes(entry.link.entries()) }] : []));
}
