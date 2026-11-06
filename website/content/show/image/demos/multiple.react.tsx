import { Image, ImagePreview } from '@fibrae/semi-ui-react';

const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg', '/assets/root-web-sites/colorful.jpg'];

export default function ImageDemo() {
    return (
        <ImagePreview>
            {srcList.map((src, index) => {
                return <Image key={index} src={src} width={200} alt={`lamp${index + 1}`} style={{ marginInlineEnd: 5 }} />;
            })}
        </ImagePreview>
    );
}
