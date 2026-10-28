import { BASE_CLASS_PREFIX } from '../base/constants';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-audio-player`,
};

export const RATE_OPTIONS = [
    { label: '0.5x', value: 0.5 },
    { label: '0.75x', value: 0.75 },
    { label: '1.0x', value: 1 },
    { label: '1.5x', value: 1.5 },
    { label: '2.0x', value: 2 },
];

export const DEFAULT_RATE = RATE_OPTIONS[2];
