import { useState } from 'react';
import { VideoPlayer } from '@fibrae/semi-ui-react';

export default function VideoPlayerDemo() {
    const [src, setSrc] = useState('/assets/video/vchart-show-video.mp4');

    const playList = [
        {
            src: '/assets/video/vchart-show-video.mp4',
            quality: '1080p',
        },
        {
            src: '/assets/video/vchart-show-video.mp4',
            quality: '480p',
        },
    ];
    const poster = '/assets/poster2.jpeg';

    const updateVideoSource = (quality: string) => {
        const source = playList.find((item) => item.quality === quality);
        if (source) setSrc(source.src);
    };

    return (
        <VideoPlayer
            height={630}
            src={src}
            poster={poster}
            defaultQuality="1080p"
            qualityList={[
                { label: '1080p', value: '1080p' },
                { label: '480p', value: '480p' },
            ]}
            onQualityChange={(quality) => {
                console.log('quality change', quality);
                updateVideoSource(quality);
            }}
        />
    );
}
