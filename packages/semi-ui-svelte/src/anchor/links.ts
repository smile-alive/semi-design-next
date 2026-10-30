import type { AnchorNode } from '@fibrae/semi-foundation/anchor/foundation';
import type { AnchorLinkItem } from './interface.js';

/** Depth-first, so the order is the order on the page */
export const hrefsOf = (items: AnchorLinkItem[]): string[] => items.flatMap((item) => [item.href ?? '#', ...hrefsOf(item.children ?? [])]);

export const nodesOf = (items: AnchorLinkItem[]): AnchorNode[] => items.map((item) => ({ href: item.href ?? '#', children: nodesOf(item.children ?? []) }));
