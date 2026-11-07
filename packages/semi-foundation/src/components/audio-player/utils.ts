import type { AudioPlayerBaseProps, AudioInfo } from './foundation';

// A list shrinking below the current index plays its last track; an empty list has none
export function getCurrentTrack(audioUrl: AudioPlayerBaseProps['audioUrl'], currentIndex: number): AudioInfo | undefined {
    const item = Array.isArray(audioUrl) ? audioUrl[Math.min(currentIndex, audioUrl.length - 1)] : audioUrl;
    return typeof item === 'string' ? { src: item } : item;
}
