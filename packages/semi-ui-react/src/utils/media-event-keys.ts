import type { MediaEventKey } from '@fibrae/semi-foundation/components/video-player/constants';

// React binds media events on the media element itself, so a handler on a wrapping div, including its capture variant, is never called.
export type MediaEventKeys = MediaEventKey | `${MediaEventKey}Capture`;
