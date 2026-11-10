import { BASE_CLASS_PREFIX } from '../../base/constants';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-videoPlayer`,
    PREFIX_CONTROLS: `${BASE_CLASS_PREFIX}-videoPlayer-controls`,
    PREFIX_PROGRESS: `${BASE_CLASS_PREFIX}-videoPlayer-progress`,
} as const;

export const strings = {
    DARK: 'dark',
    PLAY: 'play',
    NEXT: 'next',
    TIME: 'time',
    VOLUME: 'volume',
    PLAYBACK_RATE: 'playbackRate',
    QUALITY: 'quality',
    ROUTE: 'route',
    MIRROR: 'mirror',
    FULLSCREEN: 'fullscreen',
    PICTURE_IN_PICTURE: 'pictureInPicture',
} as const;

export type VideoControl = Exclude<(typeof strings)[keyof typeof strings], typeof strings.DARK>;

export const DEFAULT_CONTROLS_LIST: VideoControl[] = [strings.PLAY, strings.NEXT, strings.TIME, strings.VOLUME, strings.PLAYBACK_RATE, strings.QUALITY, strings.ROUTE, strings.MIRROR, strings.FULLSCREEN, strings.PICTURE_IN_PICTURE];

// Media events do not bubble, so a handler on a player's root div never fires; hosts derive their spelling of these keys to exclude them from the div's props
export type MediaEventKey =
    | 'onAbort'
    | 'onCanPlay'
    | 'onCanPlayThrough'
    | 'onDurationChange'
    | 'onEmptied'
    | 'onEncrypted'
    | 'onEnded'
    | 'onError'
    | 'onLoadedData'
    | 'onLoadedMetadata'
    | 'onLoadStart'
    | 'onPause'
    | 'onPlay'
    | 'onPlaying'
    | 'onProgress'
    | 'onRateChange'
    | 'onSeeked'
    | 'onSeeking'
    | 'onStalled'
    | 'onSuspend'
    | 'onTimeUpdate'
    | 'onVolumeChange'
    | 'onWaiting';

export const numbers = {
    DEFAULT_VOLUME: 100,
    DEFAULT_SEEK_TIME: 10,
    DEFAULT_PLAYBACK_RATE: 1,
} as const;

export const DEFAULT_PLAYBACK_RATE = [
    { label: '2.0x', value: 2 },
    { label: '1.5x', value: 1.5 },
    { label: '1.25x', value: 1.25 },
    { label: '1.0x', value: 1 },
    { label: '0.75x', value: 0.75 },
];
