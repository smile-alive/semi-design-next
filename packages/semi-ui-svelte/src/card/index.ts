import CardBase from './card.svelte';
import CardMetaPart from './meta.svelte';

export const Card: typeof CardBase & { Meta: typeof CardMetaPart } = Object.assign(CardBase, { Meta: CardMetaPart });
export { default as CardGroup } from './card-group.svelte';
export { default as CardMeta } from './meta.svelte';
export type { CardGroupProps, CardGroupType, CardProps, MetaProps as CardMetaProps, Shadows as CardShadows } from './interface.js';
