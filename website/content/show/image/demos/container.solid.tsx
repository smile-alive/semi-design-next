import { Index } from 'solid-js';
import { Image, ImagePreview } from '@fibrae/semi-ui-solid';

const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg'];

export default function ImageDemo() {
    return (
        <div id="container" style={{ height: '400px', position: 'relative' }}>
            <ImagePreview
                getPopupContainer={() => {
                    const node = document.getElementById('container') as HTMLElement;
                    return node;
                }}
                style={{ height: '100%', display: 'flex', 'align-items': 'center', 'justify-content': 'center' }}
            >
                <Index each={srcList}>{(src, index) => <Image src={src()} width={200} alt={`lamp${index + 1}`} style={{ 'margin-right': '5px' }} />}</Index>
            </ImagePreview>
        </div>
    );
}
