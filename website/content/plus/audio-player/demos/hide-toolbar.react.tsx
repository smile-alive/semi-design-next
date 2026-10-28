import { AudioPlayer } from '@fibrae/semi-ui-react';

export default function AudioPlayerDemo() {
    const audioUrlObj = {
        src: '/assets/components/audio1.mp3',
        title: '音频标题',
    };

    return (
        <div style={{ width: '100%' }}>
            <AudioPlayer autoPlay={false} audioUrl={audioUrlObj} showToolbar={false} />
        </div>
    );
}
