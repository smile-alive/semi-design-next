import { createSignal } from 'solid-js';
import { Select, VideoPlayer } from '@fibrae/semi-ui-solid';

const src = '/assets/video/vchart-show-video.mp4';
const poster = '/assets/poster2.jpeg';
const optionList = [
    { label: '5s', value: 5 },
    { label: '10s', value: 10 },
    { label: '15s', value: 15 },
];

export default function VideoPlayerDemo() {
    const [seekTime, setSeekTime] = createSignal(5);

    return (
        <div>
            <div>
                <span style={{ 'margin-bottom': '10px' }}>请选择快进快退时间</span>
                <Select
                    aria-label="请选择快进快退时间"
                    value={seekTime()}
                    style={{ width: '100px', 'margin-left': '10px' }}
                    onChange={(value) => {
                        if (typeof value === 'number') setSeekTime(value);
                    }}
                    optionList={optionList}
                    placeholder="请选择快进快退时间"
                />
            </div>
            <VideoPlayer height={630} style={{ 'margin-top': '10px' }} src={src} poster={poster} seekTime={seekTime()} />
        </div>
    );
}
