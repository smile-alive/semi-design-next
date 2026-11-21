import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-audio-player`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style`. The slider parts apply to both the progress and the volume slider */
export type AudioPlayerPart = 'controls' | 'playButton' | 'cover' | 'title' | 'error' | 'sliderTrack' | 'sliderProgress' | 'sliderThumb' | 'toolbar' | 'speed' | 'volumeDropdown' | 'speedDropdown';

export const RATE_OPTIONS = [
    { label: '0.5x', value: 0.5 },
    { label: '0.75x', value: 0.75 },
    { label: '1.0x', value: 1 },
    { label: '1.5x', value: 1.5 },
    { label: '2.0x', value: 2 },
];

export const DEFAULT_RATE = RATE_OPTIONS[2];
