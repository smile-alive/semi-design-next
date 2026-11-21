import type { JSX } from 'solid-js';
import type { AudioPlayerPart } from '@fibrae/semi-foundation/components/audio-player/constants';
import type { AudioUrl } from '@fibrae/semi-foundation/components/audio-player/foundation';
import type { ElementProps } from '../../base/index';
import type { MediaEventKeys } from '../../utils/index';

export type AudioPlayerTheme = 'dark' | 'light';

/** Undeclared attributes and `ref` land on the root div */
export interface AudioPlayerProps extends ElementProps<'div', MediaEventKeys | 'children'> {
    audioUrl: AudioUrl;
    autoPlay?: boolean;
    classNames?: Partial<Record<AudioPlayerPart, string>>;
    showToolbar?: boolean;
    skipDuration?: number;
    styles?: Partial<Record<AudioPlayerPart, JSX.CSSProperties | string>>;
    theme?: AudioPlayerTheme;
}
