import Card from './card.vue';
import CardMeta from './meta.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const CardWithParts: typeof Card & { Meta: typeof CardMeta } = Object.assign(Card, { Meta: CardMeta });
export default CardWithParts;
export { default as CardGroup } from './card-group.vue';
export { CardMeta };
export type * from './interface';
