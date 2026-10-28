import { Index } from 'solid-js';
import { Image, ImagePreview } from '@fibrae/semi-ui-solid';

const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg', '/assets/root-web-sites/colorful.jpg'];

export default function ImageDemo() {
    return (
        <ImagePreview>
            <Index each={srcList}>{(src, index) => <Image src={src()} width={200} alt={`lamp${index + 1}`} style={{ 'margin-right': '5px' }} />}</Index>
        </ImagePreview>
    );
}
