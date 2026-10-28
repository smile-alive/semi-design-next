import { Keys } from '@fibrae/semi-foundation/hot-keys/constants';
import HotKeys from './hot-keys.vue';

// Annotated so declaration emit refers to the SFC type instead of inlining Vue's GlobalComponents.
const HotKeysWithKeys: typeof HotKeys & { Keys: typeof Keys } = Object.assign(HotKeys, { Keys });
export default HotKeysWithKeys;
export type * from './interface';
