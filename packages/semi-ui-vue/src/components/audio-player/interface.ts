import type { ClassValue, StyleValue } from 'vue';
import type { AudioPlayerPart } from '@fibrae/semi-foundation/components/audio-player/constants';
import type { AudioUrl } from '@fibrae/semi-foundation/components/audio-player/foundation';

export type AudioPlayerTheme = 'dark' | 'light';

// Native attributes fall through to the root div. Media event listeners (`@timeupdate`, `@ended`, ...) are not
// props: on the root div they never fire, since media events do not bubble.
export interface AudioPlayerProps {
    audioUrl: AudioUrl;
    autoPlay?: boolean;
    classNames?: Partial<Record<AudioPlayerPart, ClassValue>>;
    showToolbar?: boolean;
    skipDuration?: number;
    styles?: Partial<Record<AudioPlayerPart, StyleValue>>;
    theme?: AudioPlayerTheme;
}

export interface AudioSliderProps {
    value?: number;
    max?: number;
    vertical?: boolean;
    /** Only applies when vertical */
    height?: number | string;
    showTooltip?: boolean;
    theme?: AudioPlayerTheme;
    /** Accessible name of the slider */
    label: string;
    classNames?: Partial<Record<AudioPlayerPart, ClassValue>>;
    styles?: Partial<Record<AudioPlayerPart, StyleValue>>;
    /** Spoken form of a value, announced instead of the bare number */
    getValueText: (value: number) => string;
}

export interface AudioSliderEmits {
    change: [value: number];
}
