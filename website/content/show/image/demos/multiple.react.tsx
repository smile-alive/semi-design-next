import { useMemo } from 'react';
import { Image, ImagePreview } from '@fibrae/semi-ui-react';

export default function ImageDemo() {
    const srcList = useMemo(() => ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg', '/assets/root-web-sites/colorful.jpg'], []);

    return (
        <ImagePreview>
            {srcList.map((src, index) => {
                return <Image key={index} src={src} width={200} alt={`lamp${index + 1}`} style={{ marginRight: 5 }} />;
            })}
        </ImagePreview>
    );
}
