import type { JSX } from 'solid-js';
import type { strings } from '@fibrae/semi-foundation/video-player/constants';
import type { Marker } from '@fibrae/semi-foundation/video-player/progress-foundation';
import type { ElementProps } from '../_base/element-props';
import type { MediaEventKeys } from '../_base/media-event-keys';

export interface VideoPlayerOption<T> {
    label: string;
    value: T;
}

export type VideoPlayerMarker = Marker;

export type VideoPlayerTheme = 'dark' | 'light';

export type VideoControl = Exclude<(typeof strings)[keyof typeof strings], typeof strings.DARK>;

/** Undeclared attributes land on the root div; `ref` is the native video element */
export interface VideoPlayerProps extends ElementProps<'div', MediaEventKeys | 'children' | 'ref' | 'style'> {
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
    /** The next button shows only when this is set and `controlsList` includes `next` */
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
    ref?: HTMLVideoElement | ((element: HTMLVideoElement) => void);
    routeList?: VideoPlayerOption<string>[];
    seekTime?: number;
    src?: string;
    /** On the root div, after the `width` and `height` declarations */
    style?: JSX.CSSProperties | string;
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
    onChange: (value: number) => void;
    max: number;
    /** Seconds an arrow key moves */
    step: number;
    markers?: VideoPlayerMarker[];
    bufferedValue: number;
}

export interface VideoProgressState {
    isDragging: boolean;
    movingInfo: { progress: number; offset: number; value: number } | null;
    activeIndex: number;
}
