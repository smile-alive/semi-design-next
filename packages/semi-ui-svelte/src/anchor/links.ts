import type { AnchorNode } from '@fibrae/semi-foundation/components/anchor/foundation';
import type { AnchorLinkItem } from './interface.js';

export const hrefsOf = (items: AnchorLinkItem[]): string[] => items.flatMap((item) => [item.href ?? '#', ...hrefsOf(item.children ?? [])]);

export const nodesOf = (items: AnchorLinkItem[]): AnchorNode[] => items.map((item) => ({ href: item.href ?? '#', children: nodesOf(item.children ?? []) }));
