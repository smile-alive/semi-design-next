import { VideoPlayer } from '@fibrae/semi-ui-react';

export default function VideoPlayerDemo() {
    const src = '/assets/video/vchart-show-video.mp4';
    const poster = '/assets/poster2.jpeg';
    return <VideoPlayer height={630} src={src} poster={poster} loop />;
}
