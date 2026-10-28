import { useRef } from 'react';
import { VideoPlayer, Button } from '@fibrae/semi-ui-react';

export default function VideoPlayerDemo() {
    const videoRef1 = useRef<HTMLVideoElement>(null);
    const videoRef2 = useRef<HTMLVideoElement>(null);
    const src = '/assets/video/vchart-show-video.mp4';
    const poster = '/assets/poster2.jpeg';

    const handlePlayAll = () => {
        const v1 = videoRef1.current;
        const v2 = videoRef2.current;
        if (v1) void v1.play();
        if (v2) void v2.play();
    };

    const handlePauseAll = () => {
        const v1 = videoRef1.current;
        const v2 = videoRef2.current;
        if (v1) v1.pause();
        if (v2) v2.pause();
    };

    return (
        <div>
            <div style={{ marginBottom: 12 }}>
                <Button onClick={handlePlayAll} style={{ marginRight: 8 }}>
                    同时播放
                </Button>
                <Button onClick={handlePauseAll}>同时暂停</Button>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
                <VideoPlayer ref={videoRef1} src={src} poster={poster} height={315} width="50%" />
                <VideoPlayer ref={videoRef2} src={src} poster={poster} height={315} width="50%" />
            </div>
        </div>
    );
}
