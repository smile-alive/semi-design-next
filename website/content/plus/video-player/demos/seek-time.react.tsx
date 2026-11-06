import { useState } from 'react';
import { VideoPlayer, Select } from '@fibrae/semi-ui-react';

const src = '/assets/video/vchart-show-video.mp4';
const poster = '/assets/poster2.jpeg';
const optionList = [
    { label: '5s', value: 5 },
    { label: '10s', value: 10 },
    { label: '15s', value: 15 },
];

export default function VideoPlayerDemo() {
    const [seekTime, setSeekTime] = useState(5);

    return (
        <div>
            <div>
                <span style={{ marginBottom: 10 }}>请选择快进快退时间</span>
                <Select
                    aria-label="请选择快进快退时间"
                    value={seekTime}
                    style={{ width: 100, marginLeft: 10 }}
                    onChange={(value) => {
                        if (typeof value === 'number') setSeekTime(value);
                    }}
                    optionList={optionList}
                    placeholder="请选择快进快退时间"
                />
            </div>
            <VideoPlayer height={630} style={{ marginTop: 10 }} src={src} poster={poster} seekTime={seekTime} />
        </div>
    );
}
