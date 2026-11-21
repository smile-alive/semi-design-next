import type { ClassValue, StyleValue } from 'vue';
import type { VideoControl, VideoPlayerPart } from '@fibrae/semi-foundation/components/video-player/constants';
import type { Marker } from '@fibrae/semi-foundation/components/video-player/progress-foundation';

export type VideoPlayerTheme = 'dark' | 'light';

export interface VideoPlayerOption<T> {
    label: string;
    value: T;
}

export type VideoPlayerMarker = Marker;

// Media event listeners other than the declared emits never fire on the root div, since media events do not bubble
export interface VideoPlayerProps {
    autoPlay?: boolean;
    captionsSrc?: string;
    /** `progressBuffered` and `progressPlayed` apply to every marker segment */
    classNames?: Partial<Record<VideoPlayerPart, ClassValue>>;
    clickToPlay?: boolean;
    controlsList?: VideoControl[];
    crossOrigin?: '' | 'anonymous' | 'use-credentials';
    /** Read once, when the player mounts */
    defaultPlaybackRate?: number;
    /** Read once, when the player mounts */
    defaultQuality?: string;
    /** Read once, when the player mounts */
    defaultRoute?: string;
    height?: number | string;
    loop?: boolean;
    markers?: VideoPlayerMarker[];
    /** Read once, when the player mounts */
    muted?: boolean;
    /** Called by the next button, which shows only when this is set and `controlsList` includes `next` */
    onNext?: () => void;
    playbackRateList?: VideoPlayerOption<number>[];
    poster?: string;
    qualityList?: VideoPlayerOption<string>[];
    routeList?: VideoPlayerOption<string>[];
    seekTime?: number;
    src?: string;
    styles?: Partial<Record<VideoPlayerPart, StyleValue>>;
    theme?: VideoPlayerTheme;
    /** Read once, when the player mounts */
    volume?: number;
    width?: number | string;
}

export interface VideoPlayerEmits {
    play: [];
    pause: [];
    qualityChange: [quality: string];
    rateChange: [rate: number];
    routeChange: [route: string];
    volumeChange: [volume: number];
}

export interface VideoPlayerHandle {
    /** The native video element; null before mount */
    readonly video: HTMLVideoElement | null;
}

export interface VideoProgressProps {
    value: number;
    max: number;
    /** Seconds an arrow key moves */
    step: number;
    bufferedValue: number;
    classNames?: Partial<Record<VideoPlayerPart, ClassValue>>;
    markers?: VideoPlayerMarker[];
    showTooltip?: boolean;
    styles?: Partial<Record<VideoPlayerPart, StyleValue>>;
}

export interface VideoProgressEmits {
    change: [value: number];
}

export interface ControlsMenuProps<T> {
    classNames?: Partial<Record<VideoPlayerPart, ClassValue>>;
    current: T;
    /** What the menu sets, read before the current option in the button's name */
    label: string;
    list: VideoPlayerOption<T>[];
    styles?: Partial<Record<VideoPlayerPart, StyleValue>>;
}

export interface ControlsMenuEmits<T> {
    select: [option: VideoPlayerOption<T>];
}
