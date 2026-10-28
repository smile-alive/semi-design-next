import { AudioPlayer } from '@fibrae/semi-ui-solid';

const audioUrl = '/assets/components/audio2.mp3';
const audioUrlArr = ['/assets/components/audio1.mp3', '/assets/components/audio2.mp3'];
const audioUrlObj = {
    src: '/assets/components/audio1.mp3',
    title: '音频标题',
    cover: '/assets/root-web-sites/abstract.jpg',
};
const audioUrlArrObj = [
    {
        src: '/assets/components/audio1.mp3',
        title: '音频标题1',
        cover: '/assets/root-web-sites/abstract.jpg',
    },
    {
        src: '/assets/components/audio2.mp3',
        title: '音频标题2',
        cover: '/assets/root-web-sites/abstract.jpg',
    },
];

export default function AudioPlayerDemo() {
    return (
        <div style={{ width: '100%' }}>
            <div style={{ 'margin-top': '10px' }}>
                <AudioPlayer autoPlay={false} audioUrl={audioUrl} />
            </div>
            <div style={{ 'margin-top': '10px' }}>
                <AudioPlayer autoPlay={false} audioUrl={audioUrlObj} />
            </div>
            <div style={{ 'margin-top': '10px' }}>
                <AudioPlayer autoPlay={false} audioUrl={audioUrlArr} />
            </div>
            <div style={{ 'margin-top': '10px' }}>
                <AudioPlayer autoPlay={false} audioUrl={audioUrlArrObj} />
            </div>
        </div>
    );
}
