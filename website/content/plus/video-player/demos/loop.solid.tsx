import { VideoPlayer } from '@fibrae/semi-ui-solid';

const src = '/assets/video/vchart-show-video.mp4';
const poster = '/assets/poster2.jpeg';

export default function VideoPlayerDemo() {
    return <VideoPlayer height={630} src={src} poster={poster} loop />;
}
