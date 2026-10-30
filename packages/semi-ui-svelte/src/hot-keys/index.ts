import { Keys } from '@fibrae/semi-foundation/hot-keys/constants';
import HotKeysComponent from './hot-keys.svelte';

export const HotKeys = Object.assign(HotKeysComponent, { Keys });
export type { HotKeysProps } from './interface.js';
