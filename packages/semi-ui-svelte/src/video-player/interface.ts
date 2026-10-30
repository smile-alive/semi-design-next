import type { HTMLAttributes } from 'svelte/elements';
import type { strings } from '@fibrae/semi-foundation/video-player/constants';
import type { Marker } from '@fibrae/semi-foundation/video-player/progress-foundation';

export type VideoPlayerTheme = 'dark' | 'light';

export type VideoControl = Exclude<(typeof strings)[keyof typeof strings], typeof strings.DARK>;

export interface VideoPlayerOption<T> {
    label: string;
    value: T;
}

export type VideoPlayerMarker = Marker;

// Native attributes fall through to the root div. Media event listeners other than the declared callbacks never fire
// on it, since media events do not bubble.
export interface VideoPlayerProps extends HTMLAttributes<HTMLDivElement> {
    autoPlay?: boolean;
    captionsSrc?: string;
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
    onPause?: () => void;
    onPlay?: () => void;
    onQualityChange?: (quality: string) => void;
    onRateChange?: (rate: number) => void;
    onRouteChange?: (route: string) => void;
    onVolumeChange?: (volume: number) => void;
    playbackRateList?: VideoPlayerOption<number>[];
    poster?: string;
    qualityList?: VideoPlayerOption<string>[];
    routeList?: VideoPlayerOption<string>[];
    seekTime?: number;
    src?: string;
    theme?: VideoPlayerTheme;
    /** Read once, when the player mounts */
    volume?: number;
    width?: number | string;
}

export interface VideoPlayerState {
    bufferedValue: number;
    currentQuality: string;
    currentRoute: string;
    currentTime: number;
    isError: boolean;
    isFullScreen: boolean;
    isMirror: boolean;
    isPlaying: boolean;
    muted: boolean;
    notificationContent: string;
    playbackRate: number;
    showNotification: boolean;
    showControls: boolean;
    totalTime: number;
    volume: number;
}

export interface VideoProgressProps {
    value: number;
    max: number;
    /** Seconds an arrow key moves */
    step: number;
    bufferedValue: number;
    markers?: VideoPlayerMarker[];
    showTooltip?: boolean;
    onChange?: (value: number) => void;
}

export interface VideoProgressState {
    isDragging: boolean;
    movingInfo: { progress: number; offset: number; value: number } | null;
    activeIndex: number;
}

export interface ControlsMenuProps<T> {
    current: T;
    /** What the menu sets, read before the current option in the button's name */
    label: string;
    list: VideoPlayerOption<T>[];
    onSelect?: (option: VideoPlayerOption<T>) => void;
}
