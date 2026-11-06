import { useState } from 'react';
import { VideoPlayer } from '@fibrae/semi-ui-react';

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
const qualityList = [
    { label: '1080p', value: '1080p' },
    { label: '480p', value: '480p' },
];

export default function VideoPlayerDemo() {
    const [src, setSrc] = useState(playList[0].src);

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
            qualityList={qualityList}
            onQualityChange={(quality) => {
                console.log('quality change', quality);
                updateVideoSource(quality);
            }}
        />
    );
}
