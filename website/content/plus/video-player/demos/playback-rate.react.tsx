import { VideoPlayer } from '@fibrae/semi-ui-react';

export default function VideoPlayerDemo() {
    const playbackRateList = [
        { label: '0.5x', value: 0.5 },
        { label: '1.0x', value: 1 },
        { label: '1.5x', value: 1.5 },
        { label: '2.0x', value: 2 },
    ];
    const src = '/assets/video/vchart-show-video.mp4';
    const poster = '/assets/poster2.jpeg';
    return <VideoPlayer height={630} src={src} poster={poster} playbackRateList={playbackRateList} />;
}
