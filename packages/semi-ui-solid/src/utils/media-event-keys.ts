import type { MediaEventKey } from '@fibrae/semi-foundation/components/video-player/constants';

type NamespacedEventKey<K> = K extends `on${infer Name}` ? `on:${Lowercase<Name>}` : never;

// Solid has three spellings of an event handler
export type MediaEventKeys = MediaEventKey | Lowercase<MediaEventKey> | NamespacedEventKey<MediaEventKey>;
