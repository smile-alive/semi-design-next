import type { AudioUrl } from '@fibrae/semi-foundation/components/audio-player/foundation';
import type { ElementProps } from '../../base/index';
import type { MediaEventKeys } from '../../utils/index';

export type AudioPlayerTheme = 'dark' | 'light';

/** Undeclared attributes and `ref` land on the root div */
export interface AudioPlayerProps extends ElementProps<'div', MediaEventKeys | 'children'> {
    audioUrl: AudioUrl;
    autoPlay?: boolean;
    showToolbar?: boolean;
    skipDuration?: number;
    theme?: AudioPlayerTheme;
}
