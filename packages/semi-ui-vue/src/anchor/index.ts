import AnchorLink from './anchor-link.vue';
import Anchor from './anchor.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const AnchorWithLink: typeof Anchor & { Link: typeof AnchorLink } = Object.assign(Anchor, { Link: AnchorLink });
export default AnchorWithLink;
export { default as AnchorLink } from './anchor-link.vue';
export type * from './interface';
