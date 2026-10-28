import { Index } from 'solid-js';
import { Image, ImagePreview } from '@fibrae/semi-ui-solid';

const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg'];

export default function ImageDemo() {
    return (
        <ImagePreview
            renderHeader={(title) => (
                <div style={{ width: '100%', height: '100%', display: 'flex', 'align-items': 'center', 'justify-content': 'center' }}>
                    <span style={{ background: 'black', padding: '0 10px' }}>自定义标题：{title}</span>
                </div>
            )}
        >
            <div>
                <Index each={srcList}>{(src, index) => <Image src={src()} width={200} alt={`lamp${index + 1}`} preview={{ previewTitle: `lamp${index + 1}` }} style={{ 'margin-right': '5px' }} />}</Index>
            </div>
        </ImagePreview>
    );
}
