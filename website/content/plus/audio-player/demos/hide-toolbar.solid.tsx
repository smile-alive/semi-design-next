import { AudioPlayer } from '@fibrae/semi-ui-solid';

const audioUrlObj = {
    src: '/assets/components/audio1.mp3',
    title: '音频标题',
};

export default function AudioPlayerDemo() {
    return (
        <div style={{ width: '100%' }}>
            <AudioPlayer autoPlay={false} audioUrl={audioUrlObj} showToolbar={false} />
        </div>
    );
}
