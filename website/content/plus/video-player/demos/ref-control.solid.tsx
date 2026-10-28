import { Button, VideoPlayer } from '@fibrae/semi-ui-solid';

const src = '/assets/video/vchart-show-video.mp4';
const poster = '/assets/poster2.jpeg';

export default function VideoPlayerDemo() {
    let video1: HTMLVideoElement | undefined;
    let video2: HTMLVideoElement | undefined;

    const handlePlayAll = () => {
        void video1?.play();
        void video2?.play();
    };

    const handlePauseAll = () => {
        video1?.pause();
        video2?.pause();
    };

    return (
        <div>
            <div style={{ 'margin-bottom': '12px' }}>
                <Button onClick={handlePlayAll} style={{ 'margin-right': '8px' }}>
                    同时播放
                </Button>
                <Button onClick={handlePauseAll}>同时暂停</Button>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
                <VideoPlayer ref={(element) => (video1 = element)} src={src} poster={poster} height={315} width="50%" />
                <VideoPlayer ref={(element) => (video2 = element)} src={src} poster={poster} height={315} width="50%" />
            </div>
        </div>
    );
}
