import { BASE_CLASS_PREFIX } from '../base/constants';

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
