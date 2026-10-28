import type { ElementProps } from '../_base/element-props';
import type { MediaEventKeys } from '../_base/media-event-keys';

export interface AudioInfo {
    title?: string;
    cover?: string;
    src: string;
}

export type AudioUrl = string | AudioInfo | (AudioInfo | string)[];

export type AudioPlayerTheme = 'dark' | 'light';

/** Undeclared attributes and `ref` land on the root div */
export interface AudioPlayerProps extends ElementProps<'div', MediaEventKeys | 'children'> {
    audioUrl: AudioUrl;
    autoPlay?: boolean;
    showToolbar?: boolean;
    skipDuration?: number;
    theme?: AudioPlayerTheme;
}

export interface AudioPlayerState {
    isPlaying: boolean;
    currentIndex: number;
    totalTime: number;
    currentTime: number;
    currentRate: { label: string; value: number };
    volume: number;
    error: boolean;
}
