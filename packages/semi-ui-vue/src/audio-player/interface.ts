export type AudioPlayerTheme = 'dark' | 'light';

export interface AudioInfo {
    title?: string;
    cover?: string;
    src: string;
}

export type AudioUrl = string | AudioInfo | (AudioInfo | string)[];

// Native attributes fall through to the root div. Media event listeners (`@timeupdate`, `@ended`, ...) are not
// props: on the root div they never fire, since media events do not bubble.
export interface AudioPlayerProps {
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
    /** Spoken form of a value, announced instead of the bare number */
    getValueText: (value: number) => string;
}

export interface AudioSliderEmits {
    change: [value: number];
}
